/**
 * Camada 10 · Efeitos de mutação (me)
 * Regra: só ações das rotas `/api/me/**` do próprio usuário, com o prefixo
 * `me.`. Montadas em `lib/query/effects.ts`.
 */
import { qk } from "../keys"
import type { Keys } from "./types"

export const meEffects = {
  /** Favoritar ou desfavoritar: só a lista de favoritos de quem agiu fica velha. */
  "me.favorites.toggle": (ctx: { userId: string }): Keys => [qk.me.favorites(ctx.userId)],
} satisfies Record<`me.${string}`, (ctx: never) => Keys>
