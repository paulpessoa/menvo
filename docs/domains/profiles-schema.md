# Plano: enxugar e normalizar a tabela `profiles`

> **Status:** Fases 0 e 1 concluídas e aplicadas em produção (2026-10-02): `profiles` foi de 64 para 48 colunas e os dados de importação estão em `import_records`. Próxima: Fase 2 (`mentor_profiles`), a que mexe nos mentores.
> **Para quem retoma:** leia a seção "Diagnóstico" e vá direto para a fase em aberto. Cada fase é uma PR própria.

## Objetivo

`profiles` tem 64 colunas e mistura identidade, dados de mentor, dados acadêmicos, contadores e dados brutos de importação. O objetivo é um banco mais simples, seguro e fácil de manter:

- `profiles` só com a identidade da pessoa (~20 colunas);
- dados que pertencem a outra entidade em tabelas 1:1 com chave estrangeira;
- nada guardado em duas formas (contadores e flags derivadas viram cálculo na view);
- nada coletado sem uso (LGPD art. 6º III).

Desempenho **não** é o motivo: são 718 perfis. O ganho é clareza, RLS mais simples e menos dado inconsistente.

## Diagnóstico (medido em 2026-10-01, 718 perfis)

Preenchimento real por coluna, medido com leitura direta no banco, cruzado com uso no código.

### Colunas mortas
| Coluna | Preenchidas | Uso no código |
|---|---|---|
| `location` | 0 | só em listas de select |
| `twitter_url` | 0 | perfil público lê, sempre vazio |
| `mentorship_guidelines` | 0 | só em listas de select |
| `ai_disclosure_accepted_at` | 0 | nenhum |
| `mentee_status` | 1 | só `/api/auth/me` e `/api/profile` |
| `profile_visibility` | valor único | só `/api/auth/me` e `/api/profile` |
| `show_in_community` | valor único | só `/api/auth/me` e `/api/profile` |
| `age` | 1 | lido em telas, dado pessoal sem necessidade |
| `address` | 5 | duplica `city/state/country`, dado sensível |

`community_ready` existe no banco mas não em `lib/types/supabase.ts`: os tipos gerados estão desatualizados.

### Contadores parados (bug visível)
`total_reviews` e `total_sessions` têm o mesmo valor nos 718 perfis; `average_rating` tem só 2 valores. Só o trigger `tr_update_mentor_stats` (em `appointment_feedbacks`, criado fora das migrations do repo) atualiza `average_rating` e `total_reviews`, e nada atualiza `total_sessions`. Mesmo assim busca de mentores, perfil público e dashboard do mentor exibem eles.

### Estado derivado guardado
`verified`, `verified_at` e `is_pending_mentor` são escritos por trigger (`sync_profile_verification_flags`) a partir de `verification_status` (ver `mentor-verification.md`). Três colunas para um estado. Efeito colateral já observado: 559 contas importadas do JotForm têm `verification_status = 'approved'` e `verified = true` sem papel de mentor.

### Dados de outra entidade
- **Mentor** (7 a 20 linhas preenchidas): `job_title`, `company`, `experience_years`, `expertise_areas`, `mentorship_topics`, `free_topics`, `inclusive_tags`, `mentorship_approach`, `what_to_expect`, `ideal_mentee`, `is_volunteer`, `chat_enabled`, `availability_status`, `github_url`, `portfolio_url`, `website_url`, `verification_status`, `verified_at`, `verification_notes`.
- **Acadêmico (mentorado):** `institution`, `course`, `academic_level`, `expected_graduation`, `learning_goals`, `cv_url`.
- **Importação JotForm:** `external_id`, `original_data` (603 blobs brutos do formulário), `invite_sent_at`, `origin_platform`.

## Modelo alvo

```
profiles            (identidade)   id, email, slug, first_name, last_name, full_name, avatar_url, bio,
                                   city, state, country, timezone, languages, linkedin_url, phone,
                                   email_opt_out_at, is_public, search_vector, created_at, updated_at
mentor_profiles     (1:1, PK = user_id → profiles.id)   campos de mentor + verification_status/verified_at/notes
mentee_profiles     (1:1, PK = user_id → profiles.id)   campos acadêmicos + cv_url + learning_goals
import_records      (1:1, PK = user_id → profiles.id)   origin_platform, external_id, original_data, invite_sent_at
mentors_view        junta profiles + mentor_profiles e calcula average_rating, total_reviews,
                    total_sessions e verified a partir das tabelas de origem
```

### Decisões e tradeoffs
- **Join 1:1 pela PK** custa quase nada nesse volume. Se as médias na view ficarem pesadas no futuro, troque por materialized view com refresh, não por colunas atualizadas à mão.
- **RLS por tabela** em vez de view com colunas escolhidas a dedo: `mentor_profiles` pode ser lido pelo público (só mentores verificados e públicos); `mentee_profiles`, `import_records` e `phone` ficam privados. Isso substitui a proteção frágil que motivou a migration `20260929150000_profiles_emergency_exposure_fix`.
- **Escrita em duas tabelas:** toda escrita já passa por `/api/...` (invariante BFF em `STATUS.md`). Para gravar perfil + mentor de forma atômica, use uma função RPC `security invoker`, não duas chamadas soltas.
- **Arrays ficam arrays:** `expertise_areas`, `mentorship_topics`, `languages` continuam `text[]` com índice GIN. Tabela de junção só se surgir um catálogo de áreas com tradução.
- **Links não viram tabela:** `profile_links` seria exagero hoje.
- **Compatibilidade:** o código deve ler por views (`mentors_view` e, se preciso, `profile_view`). Assim a tabela muda por baixo sem quebrar telas.

## Fases

Padrão para fases com mudança de tabela: **expand → migrar dados → trocar leitura/escrita → contract** (apagar coluna só depois que nada mais lê).

### Fase 0: limpeza e correção dos contadores (risco baixo) — feito no código, migration pendente de aplicar
1. Remover do código as referências às colunas mortas (`/api/auth/me`, `/api/profile`, `lib/schemas/profile.ts`, perfil público, `lib/auth/auth-context.tsx`, `mentee/[slug]`).
2. Migration: `drop column` de `location`, `twitter_url`, `mentorship_guidelines`, `ai_disclosure_accepted_at`, `mentee_status`, `profile_visibility`, `show_in_community`, `age`, `address`. Conferir antes se alguma view, função ou policy depende delas (`pg_depend`), e não usar `CASCADE`.
3. Recriar `mentors_view` calculando `average_rating`, `total_reviews` (de `appointment_feedbacks` aprovadas) e `total_sessions` (de `appointments` realizadas) e trocar os leitores para a view; depois apagar as três colunas.
4. Regenerar `lib/types/supabase.ts` (inclui `community_ready`).
- **Como foi feito:** os contadores vêm da view `mentor_stats` (sem `security_invoker`, só agregados; necessária porque RLS esconde feedbacks e sessões de anon), unida em `mentors_view`. A migration remove o trigger `tr_update_mentor_stats` e a função `handle_feedback_stats_update` (senão qualquer mudança de feedback falharia depois do drop; a guarda `pg_depend` revelou isso) e tem guarda que aborta se algo ainda depender das colunas, e refaz o grant de colunas de anon. `/api/dashboard/mentor` passou a devolver `averageRating`/`totalReviews` da view. `lib/types/supabase.ts` foi editado à mão; regenerar quando a migration for aplicada.
- **Pronto quando:** perfil público mostra contagens reais; `tsc`, testes e build passam; nenhuma referência às colunas apagadas.

### Fase 1: `import_records` (risco baixo) — concluída em 2026-10-02 (migrations `20261003010000` expand e `20261003020000` contract aplicadas; `profiles` agora tem 48 colunas)
1. Criar tabela + RLS só admin; copiar os 4 campos de importação.
2. Trocar leitores (`mentor-public.service.ts`, `community.service.ts`, `mentee/[slug]`, convites admin, retenção) para a nova tabela.
3. Apagar as colunas de `profiles`. Atualizar `account-retention.md` e `reengagement-invites.md`: a retenção passa a apagar `import_records`.
4. ~~Decidir o que fazer com as 560 contas `approved`/`verified` sem papel de mentor~~: decidido manter. O próprio site grava `verification_status = 'approved'` para todo mentorado ao fim do cadastro (`app/api/profile/role/route.ts`), então não é efeito do import; resolve na Fase 2.
- **Como foi feito:** `import_records` tem 605 linhas (quem tem `original_data`, `external_id`, `invite_sent_at` ou origem diferente de `menvo`). `origin_platform = 'menvo'` numa linha significa "isento da retenção". No painel admin, a aba JotForm = linha com origem `jotform`; a aba Menvo = sem linha de importação (os 46 registros de lista de espera aparecem só em "Todos"). O retorno de `/api/admin/users` continua achatando `origin_platform` e `invite_sent_at`, então a tela não mudou.
- **Ordem:** aplicar `expand` (feito) → deploy → rodar o RESYNC do rodapé do expand → exportar CSV → aplicar `contract`.

### Fase 2: `mentor_profiles` (risco médio)
1. Criar tabela + RLS (leitura pública só de verificados e públicos; escrita do próprio mentor e admin).
2. Copiar dados de quem é mentor ou tem `verification_status` não nulo.
3. Mover `verification_status`/`verified_at`/`verification_notes`; `verified` e `is_pending_mentor` viram cálculo na view; remover o trigger `sync_profile_verification_flags`.
4. RPC para salvar perfil + dados de mentor juntos; trocar formulários de perfil/onboarding.
5. Trocar leituras para `mentors_view`; só então apagar as colunas de `profiles`.
6. Atualizar `mentor-verification.md`.

### Fase 3: `mentee_profiles` (risco médio)
Mesmo padrão da Fase 2 para os campos acadêmicos e `cv_url` (bucket de storage não muda, só a coluna com a URL).

## Riscos
- Colunas de mentor aparecem em 40 a 50 arquivos: por isso a leitura via view vem antes de apagar qualquer coluna.
- Produção é o mesmo projeto Supabase: toda migration roda primeiro em branch/local, e o Paul aplica no SQL Editor como nas migrations anteriores.
- Antes de cada `drop column`, exportar a coluna (CSV) para ter rollback.
