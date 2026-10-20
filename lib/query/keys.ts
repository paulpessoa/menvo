/**
 * Camada 10 · Query keys
 * Regra: nenhuma queryKey é escrita fora de `lib/query/keys/`. As chaves são
 * hierárquicas: invalidar `qk.quiz.all` invalida tudo que começa com `["quiz"]`.
 * Tradeoff: um import a mais em cada hook, em troca de renomear e invalidar com
 * segurança e de o TypeScript achar todos os usos.
 *
 * Cada domínio tem o próprio arquivo em `keys/<domínio>.ts`; este arquivo só
 * monta o `qk`. Assim dois agentes trabalhando em domínios diferentes não
 * editam o mesmo arquivo: quem integra a branch acrescenta uma linha aqui.
 * Domínios ainda não migrados têm chaves soltas
 * (`grep -rn "queryKey:" hooks components app lib`).
 */
import { mentorsKeys } from "./keys/mentors"
import { quizKeys } from "./keys/quiz"

export const qk = {
  quiz: quizKeys,
  mentors: mentorsKeys,
} as const
