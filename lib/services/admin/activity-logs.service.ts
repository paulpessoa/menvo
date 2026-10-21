import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createAdminActivityLogsRepository } from "@/lib/repositories/admin-ops.repository"
import { assertAdmin } from "./assert-admin"
import type { ActivityLog, ActivityLogsPage } from "./activity-logs.types"

const PAGE_SIZE = 50

/** Strips PostgREST filter syntax so user text can't break out of `.or()`. */
function sanitizeTerm(term: string): string {
  return term.replace(/[,()%*\\]/g, " ").trim()
}

/**
 * Lists the user-activity trail, newest first. Search matches the changed
 * fields/values and, via one extra profiles lookup, the name or e-mail of
 * whoever did the change or whose data changed. Confirms the caller is an
 * admin first, then runs on that (session) client, so RLS on `activity_logs`
 * stays the real gate.
 *
 * @throws {AdminForbiddenError} when the caller is not an admin.
 */
export async function listActivityLogs(
  db: SupabaseClient<Database>,
  params: { search: string; table?: string; page: number }
): Promise<ActivityLogsPage> {
  await assertAdmin(db)
  const repo = createAdminActivityLogsRepository(db)

  const { rows, total } = await repo.search({
    term: sanitizeTerm(params.search),
    table: params.table,
    from: (params.page - 1) * PAGE_SIZE,
    pageSize: PAGE_SIZE
  })

  const personIds = [
    ...new Set(rows.flatMap(r => [r.actor_id, r.subject_user_id]).filter((id): id is string => !!id))
  ]
  const people = new Map((await repo.listPeople(personIds)).map(p => [p.id, p]))
  const person = (id: string | null) =>
    id ? (people.get(id) ?? { id, full_name: null, email: null }) : null

  const logs: ActivityLog[] = rows.map(r => ({
    id: r.id,
    created_at: r.created_at,
    table_name: r.table_name,
    operation: r.operation,
    record_id: r.record_id,
    changes: r.changes,
    actor: person(r.actor_id),
    subject: person(r.subject_user_id)
  }))

  return { logs, total, page: params.page, pageSize: PAGE_SIZE }
}
