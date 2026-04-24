import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"

// GET /api/cron/expire-invitations - Expire invitations cron job
export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = createServiceRoleClient()

    // Calculate expiration date (30 days ago)
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - 30)

    // Query invitations that are expired
    const { data: expiredInvitations, error: queryError } = await (serviceSupabase
        .from("organization_invitations") as any)
        .select(
          `
        id,
        organization_id,
        email,
        invited_at,
        organization:organization_id(id, name)
      `
        )
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString())

    if (queryError) {
      console.error("Error querying expired invitations:", queryError)
      throw queryError
    }

    const expiredCount = expiredInvitations?.length || 0

    if (expiredCount > 0) {
      // Update status to expired
      const invitationIds = expiredInvitations.map((inv: any) => inv.id)

      const { error: updateError } = await (serviceSupabase
        .from("organization_invitations") as any)
        .update({
          status: "expired"
        })
        .in("id", invitationIds)

      if (updateError) {
        console.error("Error updating expired invitations:", updateError)
        throw updateError
      }

      // Group by organization to notify admins
      const orgInvitationCounts: Record<string, number> = {}
      expiredInvitations.forEach((inv: any) => {
        const orgId = inv.organization_id
        orgInvitationCounts[orgId] = (orgInvitationCounts[orgId] || 0) + 1
      })

      // Notify organization admins
      const notificationResults = {
        sent: 0,
        failed: 0
      }

      for (const [orgId, count] of Object.entries(orgInvitationCounts)) {
        try {
          // Get org admins
          const { data: admins } = await serviceSupabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", orgId)
            .eq("role", "admin")
            .eq("status", "active")

          if (admins && admins.length > 0) {
            // Create notifications for admins
            const notifications = admins.map((admin) => ({
              user_id: admin.user_id,
              type: "organization_invitations_expired",
              title: "Convites expirados",
              message: `${count} convite(s) expiraram e foram removidos`,
              metadata: {
                organization_id: orgId,
                expired_count: count
              }
            }))

            await serviceSupabase.from("notifications").insert(notifications)
            notificationResults.sent += admins.length
          }
        } catch (notifError) {
          console.error(`Failed to notify admins for org ${orgId}:`, notifError)
          notificationResults.failed++
        }
      }

      console.log(
        `Expired ${expiredCount} invitations, notified ${notificationResults.sent} admins`
      )
    }

    const summary = {
      timestamp: new Date().toISOString(),
      expiredCount,
      organizationsAffected: Object.keys(
        expiredInvitations?.reduce((acc: any, inv: any) => {
          acc[inv.organization_id] = true
          return acc
        }, {} as Record<string, boolean>) || {}
      ).length
    }

    console.log("Invitation expiration job completed:", summary)

    return NextResponse.json({
      success: true,
      summary
    })
  } catch (error) {
    console.error("Error in expire-invitations cron job:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
