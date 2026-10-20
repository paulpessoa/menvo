/**
 * Camada 10 · Efeitos de mutação (quiz)
 * Regra: só ações do domínio quiz, com o prefixo `quiz.`. Montadas em
 * `lib/query/effects.ts`.
 */
import { qk } from "../keys"
import type { Keys } from "./types"

export const quizEffects = {
  /** Anônimo ou logado: o resumo do dashboard e o resultado ficam velhos. */
  "quiz.submit": (): Keys => [qk.quiz.all],
  /** Criar conta vincula o quiz ao usuário: resultado (`is_owner`) e resumo mudam. */
  "quiz.account.create": (ctx: { quizId: string }): Keys => [qk.quiz.result(ctx.quizId), qk.quiz.all],
} satisfies Record<`quiz.${string}`, (ctx: never) => Keys>
