import type { SupabaseClient } from "@supabase/supabase-js"
import type { ActivityLog, ActivityLogsPage } from "./activity-logs.types"

const PAGE_SIZE = 50

interface ActivityRow {
  id: string
  created_at: string
  actor_id: string | null
  subject_user_id: string | null
  table_name: string
  operation: "INSERT" | "UPDATE" | "DELETE"
  record_id: string | null
  changes: Record<string, unknown>
}

interface PersonRow {
  id: string
  full_name: string | null
  email: string | null
}

/** Strips PostgREST filter syntax so user text can't break out of `.or()`. */
function sanitizeTerm(term: string): string {
  return term.replace(/[,()%*\\]/g, " ").trim()
}

/**
 * Lists the user-activity trail, newest first. Search matches the changed
 * fields/values and, via one extra profiles lookup, the name or e-mail of
 * whoever did the change or whose data changed. Runs on the caller's
 * (admin) client, so RLS on `activity_logs` stays the real gate.
 */
export async function listActivityLogs(
  supabase: SupabaseClient,
  params: { search: string; table?: string; page: number }
): Promise<ActivityLogsPage> {
  const term = sanitizeTerm(params.search)
  const from = (params.page - 1) * PAGE_SIZE

  let query = supabase
    .from("activity_logs")
    .select("id, created_at, actor_id, subject_user_id, table_name, operation, record_id, changes", {
      count: "exact"
    })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (params.table) query = query.eq("table_name", params.table)

  if (term) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(50)
    const ids = (people ?? []).map(p => p.id as string)
    const filters = [`search_text.ilike.%${term.toLowerCase()}%`]
    if (ids.length > 0) {
      filters.push(`subject_user_id.in.(${ids.join(",")})`, `actor_id.in.(${ids.join(",")})`)
    }
    query = query.or(filters.join(","))
  }

  const { data, count, error } = await query.returns<ActivityRow[]>()
  if (error) throw error

  const rows = data ?? []
  const personIds = [...new Set(rows.flatMap(r => [r.actor_id, r.subject_user_id]).filter((id): id is string => !!id))]
  const people = new Map<string, PersonRow>()
  if (personIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", personIds)
      .returns<PersonRow[]>()
    for (const p of profiles ?? []) people.set(p.id, p)
  }

  const logs: ActivityLog[] = rows.map(r => ({
    id: r.id,
    created_at: r.created_at,
    table_name: r.table_name,
    operation: r.operation,
    record_id: r.record_id,
    changes: r.changes,
    actor: r.actor_id ? (people.get(r.actor_id) ?? { id: r.actor_id, full_name: null, email: null }) : null,
    subject: r.subject_user_id
      ? (people.get(r.subject_user_id) ?? { id: r.subject_user_id, full_name: null, email: null })
      : null
  }))

  return { logs, total: count ?? 0, page: params.page, pageSize: PAGE_SIZE }
}
