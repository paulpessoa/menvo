import { NextResponse } from "next/server"
import { runInactiveRetention } from "@/lib/services/retention/run-inactive.service"

/**
 * GET /api/cron/inactive-retention
 *
 * Daily automated cron job enforcing the inactive accounts retention policy (LGPD compliance).
 * Accounts without any login for > 1 year are flagged.
 * They receive a 30-day notice. If they don't log in during those 30 days,
 * their account is permanently deleted.
 *
 * Authentication: Requires `Authorization: Bearer ${CRON_SECRET}`
 */
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized: CRON_SECRET mismatch" },
        { status: 401 }
      )
    }

    // Default parameters for the cron job execution to avoid timeouts
    // and mass unexpected deletions if something goes wrong.
    const mode = "live"
    const maxEmails = 100
    const maxDeletions = 50

    const report = await runInactiveRetention({
      mode,
      maxEmails,
      maxDeletions
    })

    console.info("[CRON Inactive-Retention] Run completed:", report)

    return NextResponse.json({
      success: report.errors.length === 0,
      report,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("[CRON Inactive-Retention] Fatal error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
