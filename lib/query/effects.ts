/**
 * Camada 10 · Efeitos de mutação
 * Regra: "quando a ação X acontece, estas consultas ficam velhas". Toda mutation
 * invalida por este mapa, nunca com chave inline. Leia como a tabela de
 * dependências da tela: enviar o quiz atualiza o dashboard do mentorado porque
 * o resumo do dashboard vive em `qk.quiz.latest`, sob `qk.quiz.all`.
 */
import type { QueryClient } from "@tanstack/react-query"
import { qk } from "./keys"

type Keys = readonly (readonly unknown[])[]

export const effects = {
  /** Anônimo ou logado: o resumo do dashboard e o resultado ficam velhos. */
  "quiz.submit": (): Keys => [qk.quiz.all],
  /** Criar conta vincula o quiz ao usuário: resultado (`is_owner`) e resumo mudam. */
  "quiz.account.create": (ctx: { quizId: string }): Keys => [qk.quiz.result(ctx.quizId), qk.quiz.all],
} satisfies Record<string, (ctx: never) => Keys>

export function runEffects(qc: QueryClient, keys: Keys) {
  return Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })))
}
