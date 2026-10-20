import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"

/**
 * Raised when the caller of an admin service is not an admin (or when that
 * could not be confirmed). Routes translate it into a 403 with
 * {@link adminForbiddenResponse}.
 */
export class AdminForbiddenError extends Error {
  readonly status = 403
  readonly code = "FORBIDDEN"

  constructor(message = "Acesso negado") {
    super(message)
    this.name = "AdminForbiddenError"
  }
}

/**
 * Confirms, inside the service, that the session behind `db` is an admin.
 *
 * Why: privileged (`service_role`) clients bypass RLS and do not know who is
 * calling, so the route guard alone is not enough (ADR 0008 §2.3, ADR 0009).
 * `is_admin()` runs under the caller's own session, so the database answers
 * for the real actor. Call this BEFORE using any privileged client.
 * Denies by default: an RPC error or any non-`true` answer refuses.
 *
 * @param db Client bound to the caller's session (never the service-role one).
 * @throws {AdminForbiddenError} when the caller is not confirmed as admin.
 */
export async function assertAdmin(db: SupabaseClient<Database>): Promise<void> {
  const { data, error } = await db.rpc("is_admin")
  if (error || data !== true) throw new AdminForbiddenError()
}

/**
 * Maps {@link AdminForbiddenError} to the same 403 body `requireAdmin` uses,
 * so route handlers can keep a thin `catch`.
 *
 * @returns the 403 response, or `null` when `error` is something else (the
 * caller must handle it).
 */
export function adminForbiddenResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AdminForbiddenError)) return null
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: error.status }
  )
}
