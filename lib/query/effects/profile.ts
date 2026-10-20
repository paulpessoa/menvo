/**
 * Camada 10 · Efeitos de mutação (profile)
 * Regra: só ações do perfil próprio, com o prefixo `profile.`. Montadas em
 * `lib/query/effects.ts`.
 */
import { qk } from "../keys"
import type { Keys } from "./types"

/**
 * Raiz das consultas do catálogo de mentores (`hooks/useMentors.ts` ainda usa
 * chaves soltas começando por `"mentors"`). Quando a linha mentors criar
 * `qk.mentors.all`, trocar por ele.
 */
const MENTORS_CATALOG_ROOT = ["mentors"] as const

export const profileEffects = {
  /**
   * Salvar o perfil (ou ligar/desligar "perfil público") deixa velho o próprio
   * perfil e o catálogo: nome, foto, bio e a presença do mentor aparecem lá.
   * O perfil do `AuthContext` não é uma query; o hook chama `refreshProfile()`.
   */
  "profile.update": (): Keys => [qk.profile.all, MENTORS_CATALOG_ROOT],
} satisfies Record<`profile.${string}`, (ctx: never) => Keys>
