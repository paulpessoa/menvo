import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

/**
 * GET /api/cron/ai-retention
 *
 * Daily automated cron job enforcing AI data retention policies (LGPD compliance)
 * as defined in docs/AI_PLATFORM_PLAN.md §12.1:
 *
 * 1. Intermediate diagnostic state (diagnostic_sessions.state):
 *    - Cleared to `{}` after 30 days of completion or abandonment.
 *    - Keeps the session metadata, quota verification, and quiz_responses link.
 *
 * 2. Conversational chat threads and messages (ai_threads, ai_messages):
 *    - Purged after 12 months from the last message in the thread.
 *    - Cascades automatically to ai_messages.
 *
 * 3. Revoked diagnostic shares (diagnostic_shares):
 *    - Purged 12 months after revocation (preserving the audit log for 1 year).
 *    - Active shares remain intact while user consent is retained.
 *
 * Authentication: Requires `Authorization: Bearer ${CRON_SECRET}`
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized: CRON_SECRET mismatch" },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    const now = Date.now()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const twelveMonthsAgo = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString()

    const results = {
      clearedDiagnosticStates: 0,
      purgedAiThreads: 0,
      purgedDiagnosticShares: 0,
      errors: [] as string[]
    }

    // 1. Clear diagnostic session intermediate states (> 30 days)
    const { data: updatedSessions, error: sessionErr } = await supabase
      .from("diagnostic_sessions")
      .update({ state: {}, updated_at: new Date().toISOString() })
      .in("status", ["completed", "abandoned"])
      .lt("updated_at", thirtyDaysAgo)
      .neq("state", {})
      .select("id")

    if (sessionErr) {
      console.error("[CRON AI-Retention] Error clearing diagnostic states:", sessionErr)
      results.errors.push(`Diagnostic states error: ${sessionErr.message}`)
    } else {
      results.clearedDiagnosticStates = updatedSessions?.length ?? 0
    }

    // 2. Purge AI threads and messages older than 12 months
    const { data: deletedThreads, error: threadsErr } = await supabase
      .from("ai_threads")
      .delete()
      .lt("last_message_at", twelveMonthsAgo)
      .select("id")

    if (threadsErr) {
      console.error("[CRON AI-Retention] Error purging AI threads:", threadsErr)
      results.errors.push(`AI threads purge error: ${threadsErr.message}`)
    } else {
      results.purgedAiThreads = deletedThreads?.length ?? 0
    }

    // 3. Purge revoked diagnostic shares older than 12 months
    const { data: deletedShares, error: sharesErr } = await supabase
      .from("diagnostic_shares")
      .delete()
      .not("revoked_at", "is", null)
      .lt("revoked_at", twelveMonthsAgo)
      .select("id")

    if (sharesErr) {
      console.error("[CRON AI-Retention] Error purging revoked shares:", sharesErr)
      results.errors.push(`Diagnostic shares purge error: ${sharesErr.message}`)
    } else {
      results.purgedDiagnosticShares = deletedShares?.length ?? 0
    }

    console.info("[CRON AI-Retention] Retention run completed:", {
      clearedDiagnosticStates: results.clearedDiagnosticStates,
      purgedAiThreads: results.purgedAiThreads,
      purgedDiagnosticShares: results.purgedDiagnosticShares,
      errorsCount: results.errors.length
    })

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("[CRON AI-Retention] Fatal error in retention job:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
