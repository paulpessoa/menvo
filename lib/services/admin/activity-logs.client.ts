import { activityLogsPageSchema, type ActivityLogsPage } from "./activity-logs.types"

/** Browser-side fetch of GET /api/admin/activity-logs, validated against the shared schema. */
export async function fetchActivityLogs(params: {
  search: string
  table?: string
  page: number
}): Promise<ActivityLogsPage> {
  const qs = new URLSearchParams({ page: String(params.page) })
  if (params.search) qs.set("search", params.search)
  if (params.table) qs.set("table", params.table)
  const res = await fetch(`/api/admin/activity-logs?${qs}`)
  if (!res.ok) throw new Error("Não foi possível carregar os logs")
  return activityLogsPageSchema.parse(await res.json())
}
