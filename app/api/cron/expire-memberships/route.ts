import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
import { sendMembershipExpiredEmail } from "@/lib/email/brevo"

// GET /api/cron/expire-memberships - Expire memberships cron job
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Call database function to expire memberships
    const { data: expiredResult, error: functionError } =
      await serviceSupabase.rpc("expire_organization_memberships")

    if (functionError) {
      console.error("Error calling expire function:", functionError)
      throw functionError
    }

    // Query expired memberships to send notifications
    const { data: expiredMemberships, error: queryError } =
      await serviceSupabase
        .from("organization_members")
        .select(
          `
        id,
        user_id,
        organization_id,
        role,
        user:user_id(email, full_name),
        organization:organization_id(name)
      `
        )
        .eq("status", "expired")
        .gte("updated_at", new Date(Date.now() - 60000).toISOString()) // Last minute

    if (queryError) {
      console.error("Error querying expired memberships:", queryError)
      throw queryError
    }

    // Send expiration notification emails
    const emailResults = {
      sent: 0,
      failed: 0
    }

    if (expiredMemberships && expiredMemberships.length > 0) {
      for (const membership of expiredMemberships) {
        try {
          const user = membership.user as any
          const organization = membership.organization as any

          await sendMembershipExpiredEmail({
            userEmail: user?.email || "",
            userName: user?.full_name || "User",
            organizationName: organization?.name || "Organization"
          })
          emailResults.sent++
        } catch (emailError) {
          const user = membership.user as any
          console.error(
            `Failed to send expiration email to ${user?.email}:`,
            emailError
          )
          emailResults.failed++
        }
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      expiredCount: expiredMemberships?.length || 0,
      emailsSent: emailResults.sent,
      emailsFailed: emailResults.failed
    }

    console.log("Membership expiration job completed:", summary)

    return NextResponse.json({
      success: true,
      summary
    })
  } catch (error) {
    console.error("Error in expire-memberships cron job:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
