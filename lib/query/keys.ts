/**
 * Camada 10 · Query keys
 * Regra: nenhuma queryKey é escrita fora deste arquivo. As chaves são
 * hierárquicas: invalidar `qk.quiz.all` invalida tudo que começa com `["quiz"]`.
 * Tradeoff: um import a mais em cada hook, em troca de renomear e invalidar com
 * segurança e de o TypeScript achar todos os usos. Só o domínio quiz foi
 * migrado; as chaves soltas dos outros domínios entram aqui quando cada um for
 * tocado (`grep -rn "queryKey:" hooks components app lib`).
 */
export const qk = {
  quiz: {
    all: ["quiz"] as const,
    latest: (userId: string) => ["quiz", "latest", userId] as const,
    result: (id: string) => ["quiz", "result", id] as const,
    /** O token `k` fica fora da chave de propósito: é credencial e apareceria no devtools. */
    accountLink: (id: string) => ["quiz", "account-link", id] as const,
  },
  mentors: {
    /** Resolução de nomes sugeridos pela IA para slug/id de perfil. */
    slugs: (names: readonly string[]) => ["mentors", "slugs", [...names].sort()] as const,
  },
} as const
