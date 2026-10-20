/**
 * Camada 10 · Query keys (quiz)
 * Regra: só chaves do domínio quiz, todas começando por `["quiz"]`.
 * Montadas em `lib/query/keys.ts` como `qk.quiz`.
 */
export const quizKeys = {
  all: ["quiz"] as const,
  latest: (userId: string) => ["quiz", "latest", userId] as const,
  result: (id: string) => ["quiz", "result", id] as const,
  /** O token `k` fica fora da chave de propósito: é credencial e apareceria no devtools. */
  accountLink: (id: string) => ["quiz", "account-link", id] as const,
} as const
