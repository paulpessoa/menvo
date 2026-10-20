/**
 * Camada 10 · Query keys (admin-users)
 * Regra: só chaves da administração de usuários e das candidaturas de mentor,
 * todas começando por `["admin"]`. Os hooks importam este arquivo direto; a
 * linha em `lib/query/keys.ts` é pedido ao orquestrador.
 * Tradeoff: usuários e candidaturas são raízes separadas (`users`,
 * `verifications`) porque as telas não compartilham filtro; quem muda os dois
 * (decidir candidatura) invalida as duas raízes pelo mapa de efeitos.
 */
export const adminUsersKeys = {
  /** Tudo da lista de usuários: para invalidar todas as páginas e filtros de uma vez. */
  all: ["admin", "users"] as const,
  /** Uma página da lista; o filtro inteiro faz parte da chave (cada combinação é uma consulta). */
  list: (query: object) => ["admin", "users", "list", query] as const,
  /** Todas as filas de candidatura de mentor. */
  verificationsAll: ["admin", "verifications"] as const,
  /** Uma fila: `pending` (pendentes e com mudanças pedidas) ou `completed` (aprovadas e recusadas). */
  verifications: (queue: "pending" | "completed") => ["admin", "verifications", queue] as const,
} as const
