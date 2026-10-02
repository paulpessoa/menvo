import { adminOverviewSchema, type AdminOverview } from "./overview.types"

/**
 * Browser-side fetch of GET /api/admin/overview, validated against the shared
 * schema so a server/client drift shows up as an error, not as blank charts.
 */
export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await fetch("/api/admin/overview")
  if (!res.ok) throw new Error("Não foi possível carregar a visão geral")
  return adminOverviewSchema.parse(await res.json())
}
