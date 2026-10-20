/**
 * Camada 10 · Efeitos de mutação (org)
 * Regra: só ações do domínio org, com o prefixo `org.`. Montadas em
 * `lib/query/effects.ts`.
 */
import { orgKeys } from "../keys/org"
import type { Keys } from "./types"

export const orgEffects = {
  /**
   * A própria pessoa pediu para entrar, aceitou convite, recusou ou saiu: a
   * lista de vínculos dela muda, e o seletor de orgs administradas também
   * (quem é admin e sai deixa de administrar).
   */
  "org.membership.change": (ctx: { userId: string }): Keys => [orgKeys.memberships(ctx.userId), orgKeys.mine],
  /** O admin convidou, aprovou, removeu ou mudou a política: todos os períodos do dashboard ficam velhos. */
  "org.member.change": (ctx: { orgId: string }): Keys => [orgKeys.dashboardOf(ctx.orgId)],
} satisfies Record<`org.${string}`, (ctx: never) => Keys>
