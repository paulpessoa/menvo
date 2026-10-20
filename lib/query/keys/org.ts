/**
 * Camada 10 · Query keys (org)
 * Regra: só chaves do domínio org, todas começando por `["org"]`.
 * Montadas em `lib/query/keys.ts` como `qk.org`.
 * Tradeoff: `memberships` leva o id da pessoa na chave para a troca de conta
 * nunca mostrar o cache da anterior; `dashboard` leva o período porque cada
 * período é uma consulta diferente (os números mudam).
 */
export const orgKeys = {
  all: ["org"] as const,
  /** Organizações que a pessoa administra (seletor de /dashboard/org). */
  mine: ["org", "mine"] as const,
  /** Todos os períodos do dashboard de uma org: para invalidar de uma vez. */
  dashboardOf: (orgId: string) => ["org", "dashboard", orgId] as const,
  dashboard: (orgId: string, period: string) => ["org", "dashboard", orgId, period] as const,
  /** Convites, pedidos e participações da própria pessoa. */
  memberships: (userId: string) => ["org", "memberships", userId] as const,
} as const
