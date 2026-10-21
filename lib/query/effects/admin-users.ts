/**
 * Camada 10 · Efeitos de mutação (admin-users)
 * Regra: só ações da administração de usuários, com o prefixo `adminUsers.`.
 * Montadas em `lib/query/effects.ts`.
 * Tradeoff: a raiz `["mentors"]` (catálogo público de mentores) é escrita aqui
 * porque `keys/mentors.ts` ainda não tem `all`; quando tiver, trocar por ele.
 */
import { adminUsersKeys } from "../keys/admin-users"
import type { Keys } from "./types"

const MENTORS_CATALOG_ROOT = ["mentors"] as const

export const adminUsersEffects = {
  /** O admin editou perfil ou papéis: a lista de usuários e as filas (nome, papel) ficam velhas. */
  "adminUsers.update": (): Keys => [adminUsersKeys.all, adminUsersKeys.verificationsAll],
  /** O admin apagou a conta: some da lista, das filas e do catálogo público de mentores. */
  "adminUsers.delete": (): Keys => [adminUsersKeys.all, adminUsersKeys.verificationsAll, MENTORS_CATALOG_ROOT],
  /** O admin decidiu uma candidatura: muda a fila, o papel na lista de usuários e quem aparece como mentor. */
  "adminUsers.verification.decide": (): Keys => [
    adminUsersKeys.verificationsAll,
    adminUsersKeys.all,
    MENTORS_CATALOG_ROOT,
  ],
} satisfies Record<`adminUsers.${string}`, () => Keys>
