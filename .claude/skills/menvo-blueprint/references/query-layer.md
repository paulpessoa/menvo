# Camada 10 · Query layer (TanStack Query)

O problema que esta camada resolve: hoje as chaves são strings soltas
(`["my-appointments"]`, `['favorites', userId]`, `["admin-overview"]`) em 8
arquivos, e cada mutation decide sozinha o que invalidar. Ninguém consegue
responder "se eu enviar o quiz, o que mais na tela precisa atualizar?".

A resposta passa a morar em dois arquivos.

## 1. Fábrica de chaves: `lib/query/keys.ts`

Toda chave nasce aqui. Chaves são hierárquicas: invalidar `qk.quiz.all`
invalida tudo que começa com `['quiz']`.

```ts
/**
 * Camada 10 · Query keys
 * Regra: nenhuma queryKey é escrita fora deste arquivo.
 * Tradeoff: um import a mais em cada hook, em troca de renomear/invalidar
 * com segurança e de o TypeScript achar todos os usos.
 */
export const qk = {
  quiz: {
    all: ["quiz"] as const,
    latest: (userId: string) => ["quiz", "latest", userId] as const,
    result: (id: string) => ["quiz", "result", id] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    mentee: (userId: string) => ["dashboard", "mentee", userId] as const,
  },
} as const
```

## 2. Mapa de efeitos: `lib/query/effects.ts`

"Quando a mutação X acontece, estas consultas ficam velhas." Um lugar só.

```ts
/**
 * Camada 10 · Efeitos de mutação
 * Regra: toda mutation invalida via este mapa, nunca com chave inline.
 * Leia como uma tabela de dependências da tela.
 */
export const effects = {
  "quiz.submit": (ctx: { userId?: string }) => [
    qk.quiz.all,
    ...(ctx.userId ? [qk.dashboard.mentee(ctx.userId)] : []), // anônimo não tem dashboard
  ],
  "appointment.cancel": (ctx: { userId: string }) => [qk.appointments.all, qk.dashboard.all],
} satisfies Record<string, (ctx: never) => readonly (readonly unknown[])[]>

export function runEffects(qc: QueryClient, keys: readonly (readonly unknown[])[]) {
  return Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })))
}
```

## 3. Hooks: `hooks/<d>/`

Um arquivo por hook, nomeado pela intenção (`useLatestQuiz`, `useSubmitQuiz`).
O `fetch` e o parse da resposta com o schema Zod da camada 4 ficam aqui
(é o "client" da API).

```ts
export function useSubmitQuiz() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (input: QuizSubmitInput) => postJson("/api/quiz", input, quizSubmitResponseSchema),
    onSuccess: () => runEffects(qc, effects["quiz.submit"]({ userId: user?.id })),
  })
}
```

## 4. Persistência: duas ferramentas, papéis diferentes

| Caso | Ferramenta | Onde |
|---|---|---|
| Formulário pela metade (quiz, perfil) | `usePersistentDraft(key, schema, version)` | `hooks/usePersistentDraft.ts` → localStorage |
| Cache de dado do servidor que muda pouco (opções de filtro) | `persistQueryClient` com lista permitida | `lib/query/persist.ts` |

Regras do rascunho:
- Valida com Zod ao ler. Se falhar ou a `version` mudar, descarta (melhor
  perder um rascunho que quebrar a tela).
- `try/catch` em toda leitura/escrita (aba anônima, quota cheia).
- Limpa no `onSuccess` da mutation de envio.
- Nunca guarde e-mail/telefone de terceiros nem token.

Regras do cache persistido:
- Só chaves numa lista permitida (`persistableKeys`), nunca dado pessoal.
- `buster` = versão do app, para não reidratar formato antigo.
- Tradeoff: carrega instantâneo no segundo acesso, mas pode mostrar dado
  velho por alguns segundos. Use só onde isso é aceitável.

## 5. Server → cliente sem buscar duas vezes

```tsx
// app/[locale]/dashboard/mentee/page.tsx (Server Component)
const qc = new QueryClient()
await qc.prefetchQuery({ queryKey: qk.quiz.latest(user.id), queryFn: () => quizService.getLatestForUser(user.id) })
return <HydrationBoundary state={dehydrate(qc)}><MenteeDashboard /></HydrationBoundary>
```

A chave tem que ser **a mesma** do hook do cliente; por isso ela vem da
fábrica.

## Migração das chaves existentes

Não precisa migrar tudo de uma vez. Ao tocar em um domínio, mova as chaves
dele para `qk` e as invalidações para `effects`. O `audit` lista as chaves
soltas do domínio (`grep -rn "queryKey:" hooks components app lib`).
