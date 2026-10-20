/**
 * Camada 10 · Efeitos de mutação
 * Regra: "quando a ação X acontece, estas consultas ficam velhas". Toda mutation
 * invalida por este mapa, nunca com chave inline. Leia como a tabela de
 * dependências da tela: enviar o quiz atualiza o dashboard do mentorado porque
 * o resumo do dashboard vive em `qk.quiz.latest`, sob `qk.quiz.all`.
 *
 * Cada domínio declara as suas ações em `effects/<domínio>.ts` (prefixo
 * `<domínio>.`); este arquivo só junta os mapas, para que domínios diferentes
 * não editem o mesmo arquivo.
 */
import type { QueryClient } from "@tanstack/react-query"
import { meEffects } from "./effects/me"
import { orgEffects } from "./effects/org"
import { profileEffects } from "./effects/profile"
import { quizEffects } from "./effects/quiz"
import type { Keys } from "./effects/types"

export type { Keys }

export const effects = {
  ...quizEffects,
  ...profileEffects,
  ...meEffects,
  ...orgEffects,
} satisfies Record<string, (ctx: never) => Keys>

export function runEffects(qc: QueryClient, keys: Keys) {
  return Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })))
}
