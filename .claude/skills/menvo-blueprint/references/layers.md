# As 12 camadas, uma a uma

Cada camada tem: **onde fica**, **regra**, **não faça**, **tradeoff** e um
**template**. Os templates usam o domínio `quiz` como exemplo; troque pelo
domínio em que estiver trabalhando.

O fluxo de uma request, de ponta a ponta:

```
Componente ─▶ hook (camada 10) ─▶ fetch /api/quiz ─▶ route handler (8)
   ─▶ Zod parse (4) ─▶ service (7) ─▶ repository (5) / ports (6) ─▶ Postgres (1)
   ◀─ Entity (3) ◀─ mapper no repository ◀─ Row tipada (2)
```

---

## 1. Migration SQL

- **Onde:** `supabase/migrations/<timestamp>_<descricao>.sql`
- **Regra:** tudo que define dados vive aqui: tabela, FK, índice, check,
  trigger e **política RLS**. É SQL Postgres puro, por isso roda em qualquer
  Postgres (Supabase, Neon, RDS, local).
- **Não faça:** criar tabela pelo painel do Supabase; usar ORM que gere outra
  migration paralela; rodar `supabase db push` sem o Paul (ponto de parada).
- **Tradeoff:** SQL à mão é mais verboso que um schema Prisma/Drizzle, mas é a
  única forma de ter RLS, triggers e funções `security definer` como
  cidadãos de primeira classe. Ver ADR 0006 §3.

```sql
-- Por que: <motivo de negócio em uma linha>
alter table public.quiz_responses
  add column if not exists source text not null default 'web';

-- RLS: quem pode ler/escrever e por quê. Toda tabela nova nasce com RLS on.
alter table public.quiz_responses enable row level security;
```

## 2. Tipos gerados

- **Onde:** `lib/types/supabase.ts`
- **Regra:** gerado por `npm run db:types` depois que a migration foi aplicada.
  Use os helpers `Tables<'t'>`, `TablesInsert<'t'>`, `TablesUpdate<'t'>`,
  `Enums<'e'>`.
- **Não faça:** editar à mão; importar `Database[...]['Row']` espalhado pelo
  app. Fora do repository, ninguém importa Row.
- **Tradeoff:** o tipo gerado espelha o banco (snake_case, `null` em tudo que
  é opcional). É ótimo para o repository e ruim para a UI, por isso existe a
  camada 3.

## 3. Entity

- **Onde:** `lib/domain/<d>/<d>.entity.ts`
- **Regra:** o tipo que o negócio entende, **derivado** da Row com `Pick`,
  `Omit` e refinamentos. Pode ter funções puras do domínio
  (ex.: `isAnalysisReady(quiz)`).
- **Não faça:** redeclarar campo a campo (perde o elo com o banco); importar
  Supabase, React ou Next aqui. Entity é TypeScript puro.
- **Tradeoff:** manter snake_case evita um mapper e é o padrão atual do repo.
  Converter para camelCase deixa a UI mais idiomática, mas cria um mapper que
  precisa de teste. **Padrão MENVO: manter snake_case**, salvo motivo forte.

```ts
import type { Tables } from "@/lib/types/supabase"

type QuizRow = Tables<"quiz_responses">

/** O que a UI pode ver de um quiz. Campos internos (ip, claim) ficam de fora. */
export type Quiz = Pick<
  QuizRow,
  "id" | "name" | "career_moment" | "development_areas" | "created_at"
> & {
  analysis: QuizAnalysis | null // Json do banco já validado (ver camada 5)
}

export function isAnalysisReady(quiz: Quiz): boolean {
  return quiz.analysis !== null
}
```

## 4. Zod (contrato da API)

- **Onde:** `lib/schemas/<d>.ts`
- **Regra:** um schema para cada **entrada** (body, query, params) e cada
  **saída** de rota. Os tipos de DTO saem de `z.infer`. É também a fonte do
  OpenAPI (camada 9).
- **Não faça:** escrever `interface QuizSubmitInput` à mão ao lado do schema
  (vai divergir); validar regra de negócio aqui ("já respondeu 3 vezes este
  mês" é camada 7).
- **Tradeoff:** Zod valida em runtime e custa alguns ms por request. Em troca,
  dado inválido nunca chega ao service e o erro 400 sai com detalhes.

```ts
export const quizSubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  development_areas: z.array(z.string()).min(1).max(5),
})
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>

export const quizResultResponseSchema = z.object({ id: z.string().uuid(), /* … */ })
export type QuizResultResponse = z.infer<typeof quizResultResponseSchema>
```

## 5. Repository

- **Onde:** `lib/repositories/<d>.repository.ts`
- **Regra:** **único** arquivo que chama `supabase.from("<tabela>")`. Exporta
  uma interface e uma fábrica que recebe o client (o do usuário, com RLS).
  O mapper Row → Entity mora aqui.
- **Não faça:** criar o client dentro do repository (impede teste e esconde
  qual permissão está em uso); usar `service_role` sem ADR; regra de negócio.
- **Tradeoff:** uma interface a mais. Ganho: o service é testado com um fake em
  memória, e trocar de Postgres/driver mexe só aqui. **Não** crie repository
  genérico (`BaseRepository<T>`): cada domínio tem consultas próprias.

```ts
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"

export interface QuizRepository {
  findLatestByUser(userId: string): Promise<Quiz | null>
  insert(input: QuizInsert): Promise<void>
}

export function createQuizRepository(db: SupabaseClient<Database>): QuizRepository {
  return {
    async findLatestByUser(userId) {
      const { data, error } = await db
        .from("quiz_responses")
        .select("id, name, career_moment, development_areas, created_at, ai_analysis")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw new RepositoryError("quiz.findLatestByUser", error)
      return data ? toQuiz(data) : null
    },
    // …
  }
}

/** Mapper: o Json do banco é validado aqui, não na UI. */
function toQuiz(row: /* tipo do select */): Quiz { /* … */ }
```

## 6. Ports (serviços externos)

- **Onde:** `lib/ports/<servico>.ts` (interface) e
  `lib/ports/adapters/<servico>.<provedor>.ts` (implementação).
- **Regra:** e-mail, storage, IA, fila, calendário. O service depende da
  interface; quem escolhe o adapter é a composição (route handler ou
  `lib/ports/index.ts`).
- **Não faça:** criar port para algo que não tem chance real de troca nem
  precisa de fake em teste. `lib/ai/models` já é um bom exemplo existente:
  reaproveite, não duplique.
- **Tradeoff:** indireção a mais. Ganho: trocar Brevo por Resend é um arquivo,
  e o teste do service verifica "mandou o e-mail certo" sem rede.

```ts
export interface EmailPort {
  send(msg: { to: string; template: EmailTemplate; data: Record<string, unknown> }): Promise<void>
}
```

## 7. Service

- **Onde:** `lib/services/<d>/<d>.service.ts` (só servidor).
- **Regra:** casos de uso do domínio (`submitQuiz`, `getLatestForUser`).
  Aplica regra de negócio e **autorização** (quem pode fazer o quê, além do
  RLS), recebe repository e ports por parâmetro, lança `AppError` tipado.
- **Não faça:** importar `NextRequest`/`NextResponse` (service não sabe que
  existe HTTP); chamar `fetch("/api/...")` (isso é cliente, camada 10); criar
  client Supabase dentro.
- **Tradeoff:** RLS no banco + checagem no service parece duplicado. É
  intencional: RLS é a última barreira (vale até se alguém esquecer o
  service), o service dá a mensagem de erro clara e a regra testável.

```ts
export function createQuizService(deps: { quizzes: QuizRepository; email: EmailPort; now?: () => Date }) {
  return {
    async submit(input: QuizSubmitInput, actor: Actor): Promise<{ id: string }> {
      const recent = await deps.quizzes.countByEmailSince(input.email, daysAgo(30, deps.now))
      if (recent >= 3) throw new AppError("QUIZ_LIMIT_REACHED", "Limite de 3 análises em 30 dias")
      // …
    },
  }
}
```

`AppError` fica em `lib/errors/app-error.ts`: um `code` estável (string) e um
mapa `code → status HTTP`. Ele substitui gradualmente o `ErrorHandler` de
`lib/error-handler.ts`.

## 8. Route handler (controller)

- **Onde:** `app/api/<d>/**/route.ts`
- **Regra:** fino, sempre na mesma ordem:
  1. rate limit (se público) · 2. auth (`createClient()` / guard) ·
  3. `schema.safeParse` · 4. monta deps e chama o service ·
  5. `AppError` → status via `toHttpError()`; resto → 500 logado.
- **Não faça:** query no banco, regra de negócio, `if` de domínio. Se o
  handler passa de ~40 linhas, algo está na camada errada.
- **Lembre:** um `route.ts` do Next só pode exportar handlers HTTP e config
  (`maxDuration`, `dynamic`…). Por isso o OpenAPI fica em outro arquivo.

## 9. OpenAPI / Swagger

Ver `references/openapi.md`.

## 10. Query layer (TanStack Query)

Ver `references/query-layer.md`.

## 11. Página e componentes

- **Server Component** (`page.tsx`): chama o **service** direto (não faz
  `fetch` na própria API: seria uma volta HTTP inútil), e entrega os dados
  ao cliente via `HydrationBoundary` usando a **mesma** chave de
  `lib/query/keys.ts`.
- **Client Component:** usa os hooks de `hooks/<d>/`. Nunca chama Supabase nem
  `fetch` direto.
- **Loading:** `loading.tsx` / `<Suspense>` com skeleton para a primeira
  carga; `isPending` da mutation para botões; `useOptimistic` só quando o
  erro for raro e fácil de desfazer.
- **Componentes de UI** (`components/ui`) não conhecem domínio; componentes de
  domínio (`components/<d>`) recebem Entity por props.

## 12. Testes

Ver `references/testing.md`.
