import { NextResponse } from "next/server"
import { z } from "zod"
import { runRetention } from "@/lib/services/retention/run-retention.service"

const envSchema = z.object({
  RETENTION_MODE: z.enum(["dry_run", "live"]).default("dry_run"),
  RETENTION_MAX_EMAILS_PER_RUN: z.coerce.number().int().positive().default(100),
  RETENTION_MAX_DELETIONS_PER_RUN: z.coerce.number().int().positive().default(25)
})

/**
 * GET /api/cron/account-retention
 *
 * Daily job that advances the imported (JotForm), never-activated account
 * cohort through the retention queue: enrolls newly invited candidates,
 * releases anyone who has since signed in, sends the 30-day/1-day
 * warnings, and deletes accounts whose deadline has passed. See
 * docs/domains/account-retention.md for the design.
 *
 * Unlike the pre-existing ai-retention/appointments crons, this route
 * fails *closed*: a missing CRON_SECRET is a 500 (misconfiguration), not
 * an open endpoint. Never weaken this to match the other crons — fix them
 * instead (tracked as a P1 follow-up in the doc).
 *
 * Authentication: `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 })
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized: CRON_SECRET mismatch" }, { status: 401 })
  }

  const env = envSchema.safeParse({
    RETENTION_MODE: process.env.RETENTION_MODE,
    RETENTION_MAX_EMAILS_PER_RUN: process.env.RETENTION_MAX_EMAILS_PER_RUN,
    RETENTION_MAX_DELETIONS_PER_RUN: process.env.RETENTION_MAX_DELETIONS_PER_RUN
  })
  if (!env.success) {
    return NextResponse.json({ error: "Invalid retention env configuration", details: env.error.flatten() }, { status: 500 })
  }

  try {
    const report = await runRetention({
      mode: env.data.RETENTION_MODE,
      maxEmails: env.data.RETENTION_MAX_EMAILS_PER_RUN,
      maxDeletions: env.data.RETENTION_MAX_DELETIONS_PER_RUN
    })

    console.info("[CRON account-retention] Run completed:", {
      mode: report.mode,
      planned: report.planned,
      released: report.released.length,
      enrolled: report.enrolled.length,
      deleted: report.deleted.length,
      noticed30d: report.noticed30d.length,
      noticed1d: report.noticed1d.length,
      deferredToNextRun: report.deferredToNextRun,
      errorsCount: report.errors.length
    })

    return NextResponse.json({ success: report.errors.length === 0, ...report, timestamp: new Date().toISOString() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("[CRON account-retention] Fatal error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
