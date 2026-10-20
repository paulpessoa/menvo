# Audit do domínio appointments (14 camadas)

> Modo `audit` + `plan`: só leitura, nenhum código mudou. Data: 2026-10-19.
> Cobre as Tarefas 3 (máquina de estados) e 6 (repositório e rotas finas) do
> `hardening-plan.md`.
> Legenda: **ok** = cumpre a regra da camada; **parcial** = existe mas foge da
> regra; **falta** = não existe. A coluna "Prova" é o arquivo que sustenta o estado.

Escopo lido: `app/api/appointments/**` (12 rotas), `lib/services/appointments/`,
`lib/domain/appointments/`, `lib/schemas/appointment.ts`, `components/appointments/`,
`hooks/useMyAppointments.ts`, `lib/mentorship/group-appointments.ts`,
`lib/services/mentorship/mentorship.service.ts` (parte de sessões),
`lib/agents/capabilities/appointments.ts`, `lib/services/assistant/tools.ts`,
`app/api/cron/appointments`, as 4 migrations que criam ou alteram objetos de
`appointments` e os testes.

## Fatos do banco de produção (consulta do orquestrador, 2026-10-19)

O MCP do Supabase não autenticou na sessão da auditoria; estes fatos vieram da
CLI e **substituem** as suposições "a confirmar" que o texto abaixo ainda cita.

- **Policies** (duplicadas, 2 de cada): `INSERT` para `authenticated` com
  `with_check auth.uid() = mentee_id`; `SELECT` e `UPDATE` com
  `auth.uid() = mentor_id OR auth.uid() = mentee_id`. O `UPDATE` **não tem
  `with_check` nem restrição de coluna**: o participante muda qualquer coluna,
  inclusive `status`, `mentor_id`, `scheduled_at` e `action_token`, direto pelo
  PostgREST. Não existe policy de `DELETE` (então o `DELETE /[id]` com a sessão
  do usuário nunca apaga nada; só um `service_role` apagaria).
- **Constraints:** `CHECK status in ('pending','confirmed','cancelled','completed')`
  (**`rejected` não é um valor possível**), `UNIQUE(action_token)`, `CHECK video_service`.
- **Triggers:** `update_appointments_updated_at` (BEFORE UPDATE) e `trg_log_activity`
  (AFTER I/U/D). Nenhum de transição.
- **Dados:** 6 linhas (3 `completed`, 3 `cancelled`). Não existe `rejected`,
  nem `pending`/`confirmed` hoje.
- **Colunas:** não existe `mentorship_topics` (a coluna é `topic`).

Já resolvido fora desta linha: cancel exige participante (PR #109) e `create`
grava em `topic` (PR #110). O trigger de transição, a limpeza das policies
duplicadas e a restrição de colunas no UPDATE (antigo Grupo 2) o orquestrador
escreve, por ser SQL de segurança.

## A regra de status vive em 13 lugares

Antes da tabela, o achado principal. Quem escreve `appointments.status` hoje:

| # | Onde | Cliente | Transição que faz | Guarda |
|---|---|---|---|---|
| 1 | `api/appointments/confirm` | `service_role` | pending → confirmed | status = pending; mentor (por id) ou token |
| 2 | `api/appointments/action` | sessão/anon (RLS) | pending → confirmed/cancelled | status = pending; token |
| 3 | `api/appointments/cancel` | `service_role` | qualquer ≠ cancelled → cancelled | **nenhuma checagem de participante** (ver achado 1) |
| 4 | `api/appointments/mark-completed` | `service_role` | confirmed → completed | só o mentor |
| 5 | `api/appointments/complete` | `service_role` | confirmed/completed → completed | só o mentorado; grava avaliação antes |
| 6 | `api/appointments/no-show` | `service_role` | confirmed/completed → cancelled | só o mentor; sessão no passado; **apaga** `appointment_feedbacks` |
| 7 | `api/appointments/[id]` PATCH | sessão (RLS) | **qualquer → qualquer**, `status` do body sem Zod | participante |
| 8 | `api/appointments/create` e `schedule` | sessão (RLS) | insert pending | check-in pendente; só `schedule` checa mentor verificado e conflito |
| 9 | `api/cron/appointments` | `service_role` | pending → cancelled (expirado) | `.eq("status","pending")` (boa: update condicional) |
| 10 | `admin-appointments.service.cancelAppointmentAsAdmin` | `service_role` | pending/confirmed → cancelled | `.in("status", [...])` (boa) |
| 11 | `assistant/tools.evaluateMentorshipSession` | sessão (RLS) | confirmed/completed → completed | mentorado; sem update condicional |
| 12 | `mentorship.service` (browser): `completeSession`, `cancelSession`, `requestSession`, `respondToSession` | sessão (RLS) | vários | **nenhum chamador** (ver achado 5) |
| 13 | SQL: `resolve_appointment_checkin`, `answer_*_checkin` | `security definer` | confirmed → completed/cancelled | `v_status <> 'confirmed'` retorna (boa) |

Só os itens 9, 10 e 13 usam update condicional por status (o que torna a
transição atômica). Nos outros, a leitura e o update são dois passos: duas
requests simultâneas (mentor cancela enquanto o mentorado avalia) passam as duas
pela checagem.

Transições que o código aceita hoje e que a tabela da Tarefa 3 deve decidir:

- `completed → cancelled` pelo mentorado ou pelo mentor via `/cancel` (a rota só
  recusa `cancelled`). Só o `no-show` do mentor devia poder fazer isso.
- `cancelled → completed` e `cancelled → confirmed` via `PATCH /[id]` (nenhuma guarda).
- `pending → completed` via `PATCH /[id]` (pula a confirmação do mentor).
- `rejected`: existe no tipo (`lib/types/models/mentorship.ts`), no Zod do hook
  e na UI, mas **o CHECK do banco não o aceita** e nenhum código ativo o grava;
  só o `respondToSession` morto. O cron cancela pedido expirado em vez de
  rejeitar, e `expired` é só rótulo de UI. A entity tem os 4 estados do banco.

## Camada × estado

| # | Camada | Estado | Prova |
|---|---|---|---|
| 1 | Migration SQL | **parcial** | A tabela `appointments` **não tem `CREATE TABLE`, policy RLS, CHECK de `status` nem trigger em nenhuma migration**: as `remote_baseline` são arquivos de 167 bytes (stubs). Só aparecem alterações pontuais: `20260927000000_reengagement_invites.sql` (FK `cancelled_by`), `20260928000002_appointments_pending_followup.sql` (índice parcial de pendentes), `20261006010000_appointments_drop_cv_columns.sql`, `20261015010000_appointment_checkins.sql` (coluna `checkin_conflict` + funções que mudam o status). Não existe nada que impeça `cancelled → completed`. O check-in e o `mentor_public_stats` foram escritos supondo uma policy "participante atualiza" que não está no repositório. Mesma lacuna do `mentor_availability` no audit de mentors. |
| 2 | Tipos gerados | **parcial** | `appointments` está em `lib/types/supabase.ts:703`, mas `status` é `string` (sem enum/CHECK, então o tipo não ajuda). Vários `as any` contornam o tipo: `create/route.ts:54` (`from("appointments" as any)` + `as any` no insert), `schedule/route.ts:107,125,153,215`, `action/route.ts:54`, `[id]/route.ts:41` (`updateData: any`), `confirm/route.ts:196` (`updateData: any`), `mentorship.service.ts` (`as any` em todo update). Contradiz "Strict TypeScript, sem any" do AGENTS.md. |
| 3 | Entity | **parcial** | `lib/domain/appointments/session-checkin.entity.ts` (regra pura do check-in, com teste) é bom modelo. Falta a entity do agendamento e do **status**: a união `pending | confirmed | completed | cancelled | rejected` está copiada em 4 lugares (`lib/types/models/mentorship.ts:5`, `hooks/useMyAppointments.ts:17`, `appointment-card.tsx:39`, `appointment-status-badge.tsx:6`, este com `expired`) e a tabela de transições não existe em lugar nenhum. |
| 4 | Zod | **parcial** | `lib/schemas/appointment.ts` cobre a entrada de 6 rotas (`create`, `cancel`, `confirm`, `complete`, `no-show`, `feedback`). Faltam: `status` do `PATCH /[id]` (vem de `request.json()` cru), `action` (valida com `if`), `mark-completed` (schema inline na rota), query de `list`/`availability`/`schedule GET` (`parseInt` sem validar), `appointmentId` como UUID (hoje `string|number`, e um id inválido vira 404 porque o erro do PostgREST é tratado como "não achei"), e **toda a saída**. `schedule` não usa o schema: lê 14 chaves em snake e camelCase à mão (`scheduleAppointmentSchema` existe e não é usado por rota nenhuma). `createAppointmentSchema` aceita `duration_minutes` default 60 e `schedule` usa 45. |
| 5 | Repository | **falta** | `.from("appointments")` direto em 10 rotas (`action`, `cancel`, `complete`, `confirm`, `create`, `list`, `mark-completed`, `no-show`, `schedule`, `[id]`; a 11ª, `availability`, vai por service), no cron, em 5 services (`admin-appointments`, `availability`, `checkin-responses`, `session-checkin`, `mentorship`), em `assistant/tools.ts` (5 pontos), `briefing.ts` (2), `overview.service.ts`, `org-dashboard.service.ts` (2) e nas rotas `dashboard/mentee`, `dashboard/mentor`, `me/notifications`, `admin/stats`. Nenhum `lib/repositories/appointments*`. |
| 6 | Ports | **falta** | E-mail é função direta de `lib/email/brevo.ts` em `cancel`, `confirm`, `create`, `schedule`, `no-show`, cron e `admin-appointments`; calendário é `google-calendar.service` importado direto em `cancel`, `confirm`, `[id]` e admin. Nada é testável sem mockar o módulo inteiro (os testes de rota fazem `jest.mock("@/lib/email/brevo")`). O quiz já tem o padrão (`lib/ports/quiz-mailer.ts` + adapter). |
| 7 | Service | **parcial** | Existem services de servidor bons e testados: `session-checkin.service.ts`, `checkin-responses.service.ts`, `admin-appointments.service.ts` (com `AdminAppointmentError`, update condicional e teste de 478 linhas). Mas o ciclo principal (pedir, confirmar, cancelar, concluir, ausência) está **todo nas rotas**: `confirm/route.ts` tem 271 linhas misturando token, permissão, Google Calendar, update e e-mail; `schedule/route.ts` 234. `mentorship.service.ts` é um service de **navegador** com `supabase.from("appointments").update(...)`, violando "Never query the database directly inside a component or hook". |
| 8 | Route handler | **parcial** | 12 rotas, quase todas com comentário do porquê (bom). Fogem do "fino" (~40 linhas): `confirm` 271, `schedule` 234, `cancel` 146, `no-show` 125, `feedback` 115, `create` 111, `complete` 98, `list` 99. Três estilos de erro: `errorResponse/handleApiError` (`schedule`, `[id]`), `NextResponse.json({ error })` (maioria) e `create` devolve `details: error.message` do banco ao cliente em 500. Auth está presente em todas menos `availability` (pública, por desenho), `action` e `confirm`-por-token (credencial é o token). |
| 9 | OpenAPI | **falta** | `appointments` está em `pendingDomains` (`lib/openapi/document.test.ts:27`). `@asteasolutions/zod-to-openapi` já está instalado, então não há ponto de parada de dependência. |
| 10 | Query layer | **parcial** | `hooks/useMyAppointments.ts` usa TanStack Query, mas a chave é solta (`["my-appointments", role, user?.id]`, não está em `lib/query/keys.ts`) e a invalidação é um hook manual (`useInvalidateMyAppointments`) chamado à mão por quem lembrar. Não há `qk.appointments` nem efeitos em `effects.ts`. `AppointmentsList.tsx` e `BookingForm.tsx` usam `fetch` + `useEffect`; `cancel-appointment-button`, `confirm-appointment-button`, `complete-appointment-modal`, `no-show-modal` fazem `fetch` direto (ou via `mentorshipService`) e cada um decide o que atualizar. |
| 11 | Página e componentes | **parcial** | Acima de ~150 linhas: `appointment-card.tsx` 444, `BookingForm.tsx` 297, `cancel-appointment-button.tsx` 275, `complete-appointment-modal.tsx` 246, `confirm-appointment-button.tsx` 210 (e `components/mentorship/BookMentorshipModal.tsx` 421, ligado ao `schedule`). `lib/mentorship/group-appointments.ts` é lógica pura com teste, bom. Páginas de e-mail `appointments/confirm` (132) e `appointments/action` (144) são client components com `fetch` no `useEffect`. |
| 12 | Testes | **parcial** | Existem para `cancel` (7 casos), `confirm` (3, incluindo 403), `create` (3), `list` (2), `no-show` (4), `schedule` (9), cron, `admin-appointments.service`, check-in, `group-appointments`, `appointment.test.ts` (schemas). **Sem teste:** `action`, `availability`, `complete`, `feedback`, `mark-completed`, `[id]`. O teste de `cancel` não tem o caso "usuário que não participa" (e o código não tem a checagem). pgTAP: `appointment_checkins.test.sql` e `appointment_feedbacks_access.test.sql`; nada para `appointments` em si (policies de update, transições). E2E: nenhum fluxo de agendar. |
| 13 | Tooling e CI | **n/a** | É do repositório. |
| 14 | Superfície para agentes | **parcial** | `lib/agents/capabilities/appointments.ts` expõe `appointments.mine`, `.pendingEvaluations`, `.mentorRequests` (leitura) e `.evaluate` (escrita com `confirmation: "user"`), todos chamando `assistant/tools.ts`, que consulta `appointments` por conta própria (5 queries) em vez de um service do domínio. `appointments.evaluate` troca o status por conta própria (item 11 da tabela acima). |

## Achados que não são "falta de camada"

1. **`POST /api/appointments/cancel` deixa qualquer usuário logado cancelar
   qualquer agendamento (falha de segurança).** A rota usa `service_role`
   ("para bypass RLS") e, depois de achar o agendamento pelo `appointmentId`,
   só confere que ele não está cancelado. Não compara `user.id` com
   `mentor_id`/`mentee_id` (`cancel/route.ts:48-71`). Quem tiver um UUID de
   agendamento cancela a sessão de outros, o evento do Google Calendar é
   apagado em nome dessa pessoa e um e-mail "cancelado por X" sai para o outro
   lado. `no-show`, `mark-completed`, `complete` e `[id]` têm a checagem; esta
   perdeu-se (e o teste não a cobre). UUIDs não são listáveis, o que reduz o
   risco, mas a regra do projeto é corrigir falha de segurança por inteiro.
   Correção de 6 linhas + 2 testes, **Grupo 0**, antes de tudo.
2. **Oito rotas com `service_role`, nenhuma com ADR.** O ADR 0005 cobre convites
   e o 0007 o quiz. Razão provável de cada uma (a confirmar com a lista de
   policies, Grupo 0):
   | Rota | Razão provável | Alternativa sem `service_role` |
   |---|---|---|
   | `availability` (GET, público) | Visitante anônimo precisa saber quais horários do mentor estão ocupados; `appointments` não tem leitura para `anon`. Lê também `mentor_availability` (mesma lacuna do audit de mentors) | RPC `security definer` `mentor_busy_slots(mentor, de, ate)` devolvendo só `(scheduled_at, duration_minutes)`, no molde do `mentor_public_stats` |
   | `confirm` (token e id) | O caminho do e-mail não tem sessão: o token é a credencial. O caminho por id exige sessão do mentor, mas usa o mesmo client privilegiado. Também lê e-mail dos dois perfis para convidar no Calendar | Token: precisa de privilégio (ADR). Por id: client do usuário + RPC de contato |
   | `cancel` | Embed `mentor:mentor_id(email)`/`mentee:...` bloqueado pela RLS de `profiles` para ler o e-mail da outra parte; mais a escrita sem depender da policy de update | O update pode ir pela sessão do participante; só a leitura do contato precisa de privilégio |
   | `complete` | Ler o agendamento e checar duplicata em `appointment_feedbacks` sem depender das policies | Dispensável: o `assistant/tools` já faz o mesmo com o client do usuário ("a policy do participante basta") |
   | `mark-completed` | Idem | Dispensável |
   | `no-show` | Idem, mais **apagar** `appointment_feedbacks` do mentorado (um mentor não tem permissão de delete nessa tabela) e ler o e-mail do mentorado | A exclusão do feedback é uma regra de negócio que merece RPC ou ficar explícita no ADR |
   | `list` | Embed de `profiles` da outra ponta (comentário explícito na rota: sem isso o embed vira `null` e o `ChatButton` quebra a página) | View/RPC que devolve nome, avatar e `linkedin_url` do par de uma sessão, ou policy de `profiles` "par de sessão". E-mail do par também sai hoje nesta rota |
   | `feedback` (GET/PATCH) | Mesmo embed de `profiles`; o PATCH usa `service_role` para editar a própria avaliação | O PATCH é dono-only: policy de update do `reviewer_id` bastaria |
   O padrão é "usei `service_role` para contornar uma RLS que eu não sei qual é".
   Consolidar em um ADR (0008) com poucas exceções reais é o ganho do blueprint.
3. **`PATCH /api/appointments/[id]` é a rota mais perigosa e não tem chamador.**
   Aceita qualquer `status` do corpo, sem Zod, com o client do usuário: um
   mentorado muda o próprio pedido de `pending` para `confirmed`, ou `cancelled`
   para `completed`. Não há `fetch` para ela em `app/`, `components/`, `hooks/` ou
   `lib/`. O `DELETE` da mesma rota apaga o agendamento de vez. Mesmo sem
   chamador, enquanto a policy de update do participante não limitar colunas,
   o `PostgREST` direto faz o mesmo (`from("appointments").update({status})`
   com a sessão do usuário, que é exatamente o que `evaluateMentorshipSession` faz).
   Por isso o trigger do Grupo 2 é a defesa que importa, não só apagar a rota.
4. **`/api/appointments/create` falhava em produção (confirmado; corrigido no
   PR #110).** Inseria
   `mentorship_topics`, coluna que **não existe** na `Row` (`lib/types/supabase.ts`
   tem `topic: string | null`); o `as any` esconde o erro de tipo e o teste usa
   mock do Supabase. A rota é usada por `BookingForm` em `/appointments/book/[mentorId]`,
   para onde aponta o link "agendar de novo" de `complete-appointment-modal`. Também
   usa duração padrão 60 (o `schedule`, 45), não checa mentor verificado nem
   horário ocupado, e devolve `error.message` do banco. `create` e `schedule`
   são dois casos de uso "pedir uma mentoria" que divergiram. A confirmar
   com um insert de teste ou nos logs da Vercel antes de mexer.
5. **Código morto que escreve status:** `mentorship.service.ts` (navegador) tem
   `requestSession`, `respondToSession` (grava `rejected`), `completeSession`,
   `cancelSession`, `getMentorSessions`, `getMenteeSessions`, `getSession` e
   `getMentorStats` sem nenhum chamador. `GET /api/appointments/schedule` também
   não tem chamador. `/api/appointments/action` + `app/[locale]/appointments/action`
   não são linkados por nenhum e-mail (`brevo.ts:346` aponta para `/appointments/confirm`),
   e a rota roda com o client de sessão: para um visitante anônimo a RLS devolve
   0 linhas e o usuário vê "token inválido". Apagar é ponto de parada (decisão D3).
6. **Token de confirmação não expira onde deveria.** `schedule` grava
   `token_expires_at` (7 dias) e `admin-appointments.service` o respeita, mas
   `confirm` e `action` nunca o consultam, e `create` nem o grava. Um link de
   e-mail de meses atrás ainda confirma o pedido, desde que esteja `pending`
   (na prática o cron cancela depois que a data passa; o risco é para pedidos
   futuros). Decisão D4.
7. **Conflito de horário não é atômico.** `schedule` faz `select` por
   `mentor_id + scheduled_at + status in (pending, confirmed)` e depois `insert`.
   Dois mentorados no mesmo segundo reservam o mesmo horário. O índice parcial
   `20260928000002` é por `(status, scheduled_at)` e não é único. O conflito por
   **sobreposição** (45 min) nem é checado, só igualdade exata do início. Um
   índice único parcial `(mentor_id, scheduled_at) where status in ('pending','confirmed')`
   resolve a igualdade; precisa verificar duplicatas antes. Opcional no Grupo 7.
8. **Notificação e update em dois passos sem rollback.** `confirm`/`cancel`/`no-show`
   atualizam o banco e depois enviam e-mail em `try/catch` que engole a falha.
   É a motivação da Tarefa 5 (outbox), fora desta linha; o service deve deixar o
   ponto de gancho (um único método `notify(...)` do port) para a Tarefa 5 trocar.
9. **Cron e `appointments.evaluate` fora do domínio** (listados no pedido):
   `app/api/cron/appointments/route.ts:60` (pending → cancelled, update condicional,
   encaixa na tabela como `system`) e `lib/services/assistant/tools.ts:580`
   (confirmed/completed → completed pelo mentorado). Também `app/api/admin/appointments/**`
   e `app/api/dashboard/{mentee,mentor}`, `me/notifications`, `admin/stats` leem
   `appointments`. São de outros domínios; ver "Pedidos para arquivos de outros
   domínios".
10. **O `no-show` apaga avaliações.** `no-show/route.ts:96` faz `delete` em
    `appointment_feedbacks` por `appointment_id` (inclusive feedback de uma sessão
    `completed`). Intencional (comentado), mas é destruição de dado do mentorado
    por decisão do mentor, sem registro. Registrar no ADR ou trocar por
    `status = rejected` na avaliação (domínio de feedback; fora do escopo).

## Resumo

| Estado | Camadas |
|---|---|
| ok | nenhuma |
| parcial | 1, 2, 3, 4, 7, 8, 10, 11, 12, 14 |
| falta | 5, 6, 9 |
| n/a | 13 |

O que existe de bom: o check-in (entity pura + service + RPCs `security definer` +
pgTAP) já é o padrão do blueprint em miniatura, e o `admin-appointments.service`
tem update condicional e erros tipados. O que falta é pôr o **ciclo principal** na
mesma forma e, antes, uma única definição de transição de status, com o banco como
última barreira. Há um bug de segurança (cancel) e um provável bug de produção
(create) que valem PRs próprios.

---

# Plano

> Modo `plan`: só documento. **Cada grupo é um PR separado**, pequeno, que deixa o
> app funcionando e termina com `npm run verify` (mais `build` quando mexe em
> rota ou página). Testes no mesmo PR, nunca no fim. Prefixo de migration:
> `20261020`. Formato das respostas das rotas **não muda** em nenhum grupo; onde
> um grupo muda comportamento (erro novo para uma transição impossível), está dito.

## Decisões suas antes de começar

| # | Decisão | Por que trava | Minha sugestão |
|---|---|---|---|
| D1 | `service_role` nas 8 rotas: escrever o **ADR 0008** com poucas exceções reais, trocar o resto por sessão do usuário e RPC | Regra do projeto: exceção só com ADR, dentro de um service. Ponto de parada do blueprint | ADR 0008 com 4 exceções: (a) `availability` público, (b) fluxos por token do e-mail (`confirm`), (c) leitura do contato/perfil da outra parte, (d) cron e admin. `complete`, `mark-completed`, `cancel` (a escrita) e `feedback PATCH` passam a usar o client do usuário, **se** o Grupo 0 confirmar a policy de update do participante. Se a policy não existir, a mesma migration do Grupo 2 a cria. Troca de (a) e (c) por RPC fica para depois (migration separada, baixo risco) |
| D2 | `create` e `schedule` são dois casos de uso iguais; `create` provavelmente quebra (`mentorship_topics`) | Escolher qual sobrevive muda o que `/appointments/book/[mentorId]` chama | Primeiro confirmar o bug (Grupo 0). Depois um único `requestAppointment` no service, e as duas rotas viram adaptadores finos que mantêm cada formato de resposta. Apagar `create` só quando o link "agendar de novo" apontar para o `BookMentorshipModal` (outra decisão de UI) |
| D3 | Apagar código morto: `PATCH/DELETE /api/appointments/[id]`, `GET /schedule`, `/api/appointments/action` + página `appointments/action`, e os métodos de status do `mentorship.service` (navegador) | Apagar arquivo que não criei é ponto de parada | Sim, depois de conferir os logs da Vercel dos últimos 30 dias (nenhum hit). Entram no Grupo 9, não antes de o trigger estar aplicado (o trigger é a proteção, a remoção é limpeza) |
| D4 | Fazer `confirm`/`action` respeitarem `token_expires_at` e gravar 7 dias também em `create` | Muda comportamento: links antigos param de funcionar | Sim, tratando `token_expires_at is null` como válido (linhas legadas). O admin já tem "reenviar" que renova o token |

## Grupos, em ordem

Os grupos 0 a 9 cobrem as camadas 1 a 8 (Tarefa 3 e Tarefa 6 de `hardening-plan.md`).
Os grupos 10 a 13 são as camadas 9, 10, 11 e 14, para depois.

### Grupo 0 · Antes de codar: consulta e correção do cancel · sem migration
Dois PRs pequenos, independentes.

**PR 0a · `fix(appointments): cancel exige ser participante`** (segurança)
- `cancel/route.ts`: depois do `select`, recusar com 403 se `user.id` não for `mentor_id` nem `mentee_id` do agendamento (admin segue pela rota admin, que tem o próprio service). Hoje o admin que usa a UI de cancelamento de sessão usa `/api/admin/appointments/[id]/cancel`; confirmar no PR que nenhum fluxo legítimo cancela como não-participante.
- Testes: não participante → 403 e nada é atualizado nem enviado; participante continua passando.
- O formato de sucesso não muda. Risco: baixo.

**Consulta de leitura (você ou o orquestrador, sem PR)** para fechar o que o MCP não leu:
```sql
select policyname, cmd, roles, qual, with_check from pg_policies where tablename='appointments';
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.appointments'::regclass;
select status, count(*) from appointments group by 1;
select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid='public.appointments'::regclass and not tgisinternal;
```
**Resolvido (ver "Fatos do banco de produção" no topo):** o participante pode dar `update` em qualquer coluna; já existe CHECK de 4 estados; não há linha `rejected`; `mentorship_topics` não existe. **Estado dos PRs:** 1 = PR #109 (feito); o bug do `create` = PR #110 (feito); o PR 3 (trigger + policies + colunas) é do orquestrador; esta linha segue com os PRs 2 e 4.

### Grupo 1 · Entity e Zod do status (camadas 3–4) · sem migration
- `lib/domain/appointments/appointment-status.entity.ts`: `APPOINTMENT_STATUSES`, `type AppointmentStatus`, `type TransitionActor = "mentor" | "mentee" | "admin" | "system"`, tabela `TRANSITIONS` (de → para → quem pode), `canTransition(from, to, actor)` e `assertTransition(...)` puras que lançam `InvalidTransitionError` com `code` estável. `from === to` não é transição (idempotente).
- Tabela proposta (a conferir contra o resultado do Grupo 0):

  | De → para | mentor | mentee | admin | system |
  |---|---|---|---|---|
  | pending → confirmed | sim (id ou token) | não | não | não |
  | pending → cancelled | sim (recusar) | sim (desistir) | sim | sim (cron: expirou) |
  | confirmed → completed | sim | sim (avaliar) | não | sim (check-in) |
  | confirmed → cancelled | sim | sim | sim | sim (check-in) |
  | completed → cancelled | sim (**só** no-show) | não | sim | não |
  | cancelled → qualquer | não (terminal) | não | não | não |
  | `rejected` | fora da tabela: o CHECK do banco não o aceita e não há linha com esse valor | | | |

  Muda comportamento hoje: `completed → cancelled` pelo mentorado (hoje a rota `cancel` deixa) passa a ser recusado a partir do Grupo 4/5. `pending → completed` e `cancelled → *` do `PATCH /[id]` deixam de existir.
- `lib/schemas/appointment.ts`: `appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES)`, `appointmentIdSchema` (string UUID; **não** aplicado às rotas ainda, para não trocar 404 por 400 sem avisar), `markCompletedAppointmentSchema` (sai da rota), `listAppointmentsQuerySchema` (role/status/limit com default e teto), `availabilityQuerySchema`, `actionAppointmentSchema`.
- Troca as 4 cópias da união pelo tipo da entity (`hooks/useMyAppointments.ts`, `appointment-card.tsx`, `appointment-status-badge.tsx`). `lib/types/models/mentorship.ts:5` é compartilhado com a linha de mentors/mentorship: pedido ao orquestrador (ver abaixo), ou o PR só re-exporta daquele arquivo.
- Testes: a tabela inteira (todas as combinações de 5 × 5 × 4 atores), os schemas.
- Risco: **baixo**. Não muda nenhuma rota.

### Grupo 2 · Trigger de transição no banco (camada 1) · **com migration**
`supabase/migrations/20261020000000_appointments_status_transitions.sql` (+ pgTAP `supabase/tests/appointments_status_transitions.test.sql`)
- Função `appointments_check_status_transition()` e trigger `before update of status on appointments` que recusa pares fora da tabela do Grupo 1 com `raise exception ... using errcode = 'P0001', message = 'appointment_invalid_transition: <de> -> <para>'` (mensagem clara, mapeada pelo service).
- Atores: quando `auth.uid()` não é nulo (chamada direta pelo cliente, ex.: `PATCH /[id]`, `evaluateMentorshipSession`), o trigger confere o papel (mentor / mentee / `is_admin()`) contra a tabela; quando é nulo (`service_role`, cron, `security definer` sem JWT), vale só o par de → para. Tradeoff: o banco não sabe qual usuário está por trás de uma rota `service_role`, então a checagem de ator dessas rotas continua no service (Grupo 4+). O que o trigger garante é que **nenhum caminho consegue um par impossível**.
- Funções do check-in (`resolve_appointment_checkin`) já só transitam `confirmed → completed/cancelled`: dentro da tabela, sem mudança.
- Se o Grupo 0 mostrar que a policy de update do participante não existe ou deixa mudar `mentor_id`, `mentee_id`, `scheduled_at` ou `action_token`, esta migration também a corrige (política de update restrita ao participante + trigger que bloqueia mudar essas colunas fora de `service_role`). Pontos de parada: eu escrevo o arquivo e **não rodo `db push`**; você aplica e cola o resultado.
- Testes pgTAP: cada par permitido passa; `cancelled → completed`, `cancelled → confirmed`, `pending → completed`, `completed → confirmed` falham com a mensagem; mentorado não confirma o próprio pedido; terceiro não atualiza; `service_role` (uid nulo) respeita a tabela de pares.
- Docs no mesmo PR: `docs/domains/scheduling.md` ganha o diagrama mermaid `stateDiagram-v2` da tabela e a coluna `status` corrigida (hoje lista `rejected` sem dizer que ninguém grava).
- Risco: **médio**. Se algum fluxo vivo usar um par fora da tabela, ele passa a falhar em produção. Mitigação: a consulta `select status, count(*)` + os logs de erro 400/500 de `PATCH /[id]` antes de aplicar; a tabela inclui todo par feito por uma rota ativa (o único par ativo "ilegal" é `completed → cancelled` do mentorado via `cancel`, que a tabela barra só para mentee; o `service_role` não é barrado por ator). O PR 4 em diante trata o erro `appointment_invalid_transition` como 409.

### Grupo 3 · Repository (camada 5) · sem migration
- `lib/repositories/appointments.repository.ts`: interface `AppointmentsRepository` + `createAppointmentsRepository(db)` (recebe o client; mesma regra do quiz: o client é escolhido por quem monta). Métodos que as rotas usam hoje: `findById`, `findByActionToken`, `findWithParties(id)` (o embed de mentor e mentee), `listForUser({ userId, role, status, limit })` (com `feedbacks`), `insertPending`, `findConflict(mentorId, scheduledAt)`, `transitionStatus({ id, from, to, patch })` (update **condicional** `.eq("status", from)` que devolve `null` se perdeu a corrida: é o que o cron e o admin já fazem), `updateNotes`, `setCalendarFields`, `renewActionToken`.
- Mapper Row → Entity (`lib/domain/appointments/appointment.entity.ts`, `Pick` da Row, `status` com o tipo do Grupo 1). Sem `as any`: o insert usa `TablesInsert<"appointments">`. Erro vira `RepositoryError` (já existe).
- `appointment-feedbacks.repository.ts` à parte (tabela diferente; usada por `complete`, `feedback`, `no-show`): `findByReviewer`, `insert`, `deleteByAppointment`, `listForUser`, `updatePublic`.
- Testes: client falso (padrão `quiz.repository.test.ts`): cada método monta a query esperada, `transitionStatus` devolve `null` quando 0 linhas.
- Risco: **baixo**. Ninguém chama ainda (sem uso real até o Grupo 4); o PR só adiciona arquivos. É deliberado: mantém o PR revisável. Se preferir, junta com o Grupo 4.

### Grupo 4 · Ports + service + 2 rotas simples (camadas 6–8) · sem migration
- `lib/ports/appointment-mailer.ts` (interface: `sendCancellation`, `sendConfirmation`, `sendRequest`, `notifyAdminNewRequest`) + `lib/ports/adapters/appointment-mailer.brevo.ts`. Port de calendário `lib/ports/calendar.ts` + adapter sobre `google-calendar.service` fica para o Grupo 5, quando é usado.
- `lib/services/appointments/appointments.service.ts` (nome distinto dos services existentes) com um **único** método interno `transition(id, to, actor, patch)` que busca, confere o ator com `assertTransition`, chama `repo.transitionStatus` condicional e devolve uniões (`kind: "ok" | "not_found" | "forbidden" | "invalid_transition" | "changed"`), no estilo do `quiz.server.service.ts`. Mais `appointments.composition.ts` (cria o client do usuário e, de forma preguiçosa, o `service_role`, nunca no topo do módulo).
- Rotas migradas: `mark-completed` (74 linhas, confirmed → completed, mentor) e `no-show` (125, confirmed/completed → cancelled, mentor, e-mail, apaga feedback). Elas ficam em auth → Zod → service → status. Mensagens e códigos HTTP **idênticos** (403, 400 com o mesmo texto, 404). Os testes existentes de `no-show` seguem passando sem edição; `mark-completed` ganha teste.
- `service_role` continua nessas duas até o ADR 0008 (D1) decidir; entra por `adminRepo`, nunca na rota.
- Risco: **baixo-médio**. É o primeiro PR que troca o caminho de escrita: validar à mão no preview (mentor conclui, mentor registra ausência).

### Grupo 5 · Cancelar, concluir e listar (camadas 7–8) · sem migration
- Port de calendário + adapter. Service: `cancel` (participante, calendário, e-mail para a outra parte), `evaluate` (era `complete`: grava avaliação e conclui, na ordem de hoje), `listMine`. Rotas migradas: `cancel` (146 → ~30), `complete` (98), `list` (99).
- `list` mantém o embed de `profiles` com o client privilegiado dentro do repository (item (c) do ADR 0008); as duas rotas viram finas. O formato `{ appointments, count }` não muda.
- `cancel` passa a recusar `completed → cancelled` pelo mentorado (tabela do Grupo 1): único comportamento que muda; entra nos testes e na descrição do PR.
- Testes: `complete` e `list` ganham teste de service; `cancel` e `list` existentes passam sem edição.
- Risco: **médio**. `cancel` mexe em Google Calendar + e-mail; manter a ordem atual (update → calendário → e-mail, falha de e-mail não derruba).

### Grupo 6 · Confirmar (token e id) e feedback (camadas 7–8) · sem migration, depende de D1 e D4
- Service `confirm` (token ou id; calendário, notas, e-mail), com a decisão D4 (`token_expires_at`) e o update condicional `pending → confirmed` (resolve a corrida contra o cron). `confirm` 271 → ~35 linhas. `action` migra junto se D3 ainda mantiver a rota; senão é apagada no Grupo 9.
- `feedback` (GET `received|sent`, PATCH): mover para o service/`appointment-feedbacks.repository`, com o embed de `profiles` no repository.
- **ADR 0008** entra neste PR (D1). `docs/governance/adr/0008-appointments-service-role.md`.
- Testes: os 3 casos de `confirm` passam sem edição; novos: token expirado → mesmo erro de token inválido, race com cron → "já processado".
- Risco: **médio-alto**. `confirm` é o fluxo do e-mail do mentor (a conversão do produto). Passo a passo manual: criar pedido, abrir o link, confirmar, conferir evento e e-mail.

### Grupo 7 · Pedir mentoria: `schedule` e `create` (camadas 7–8) · migration opcional
- Service `requestAppointment`: check-in pendente (409 `pending_checkin`), mentor existe e verificado, sem auto-agendamento, conflito, insert, e-mail ao mentor (e aviso ao admin). `schedule` e `create` viram adaptadores que normalizam a entrada (snake e camelCase do `schedule` vão para um schema Zod único) e mantêm **cada** formato de resposta.
- Corrige em passant (confirmado no Grupo 0): `mentorship_topics` → `topic`; mesma duração padrão (45, a de `scheduling.md`); `create` deixa de devolver `details: error.message`.
- Migration opcional `20261020000100_appointments_no_double_booking.sql`: índice único parcial `(mentor_id, scheduled_at) where status in ('pending','confirmed')`. Só depois de `select mentor_id, scheduled_at, count(*) ... having count(*) > 1` dar vazio. Para na decisão sua antes de aplicar.
- Risco: **alto**. É a rota de maior tráfego e tem dois chamadores com formatos diferentes. Os 9 testes de `schedule` e 3 de `create` precisam passar **sem edição**.

### Grupo 8 · Disponibilidade (camadas 5–8) · migration opcional
- `availability.service.ts` passa a receber um `AppointmentsRepository` (hoje faz `.from("appointments")` com o client recebido, linha 32) e a rota deixa de criar um `createClient` com a chave `service_role` no meio do handler: o client sai por `appointments.composition.ts`. Mantém o retorno `{ success, availableSlots, totalSlots }`.
- Opcional, se D1 aceitar: migration `20261020000200_mentor_busy_slots.sql` (RPC `security definer` que devolve só o horário e a duração dos pedidos pending/confirmed de um mentor) e a rota passa a ler com `anon`. Elimina a exceção (a) do ADR. Depende de `mentor_availability` (linha de mentors) para a outra metade da leitura: só dá para tirar o `service_role` quando as duas saírem.
- Testes: `availability` (nenhum hoje).
- Risco: **baixo**.

### Grupo 9 · Remoções e demais escritores de status · sem migration, depende de D3
- Apagar o que D3 aprovar: `PATCH/DELETE /[id]`, `GET /schedule`, `/action` (rota + página), `requestSession/respondToSession/completeSession/cancelSession/getSession/getMentorSessions/getMenteeSessions/getMentorStats` do `mentorship.service.ts` e os `as any` que sobrarem. Arquivo compartilhado com a linha de mentors: ver pedidos.
- `admin-appointments.service.cancelAppointmentAsAdmin` e os `.update` de `renewActionToken`/`pending_reminder` passam pelo repository (hoje com `AnyClient`).
- Verificação final da Tarefa 6: `grep -rn 'from("appointments")'` só no repository (mais as leituras de outros domínios que ficam com pedido ao orquestrador).
- Risco: **baixo** (remoção de código sem chamador, com os logs conferidos).

### Depois (camadas 9–11 e 14), um PR por grupo
- **Grupo 10 · Contrato (9):** `lib/openapi/paths/appointments.ts` com os schemas do Grupo 1; tirar `appointments` de `pendingDomains`. Sem dependência nova.
- **Grupo 11 · Query layer (10):** `lib/query/keys/appointments.ts` (`qk.appointments.mine(role, userId)`), `effects`: confirmar, cancelar, concluir, avaliar e ausência invalidam `mine`; `hooks/appointments/` (`useMyAppointments`, `useCancelAppointment`, `useConfirmAppointment`, ...). Substitui `useInvalidateMyAppointments` manual. Arquivos compartilhados: pedido.
- **Grupo 12 · Componentes (11):** quebrar `appointment-card.tsx` (444), `BookingForm.tsx`, `cancel-appointment-button.tsx`, `complete-appointment-modal.tsx`, `confirm-appointment-button.tsx` em peças de <150 linhas, usando os hooks do Grupo 11. Você valida a UI antes do próximo.
- **Grupo 13 · Agentes (14):** as 4 capabilities de `appointments.*` passam a chamar `appointments.service` em vez de `assistant/tools.ts`; `appointments.evaluate` deixa de trocar status por conta própria. Não libera capability nova.

## Pontos de parada que este plano vai tocar
1. Grupo 0: você roda (ou autoriza) a consulta de policies/constraints/status. O resultado pode mudar o Grupo 2.
2. Grupo 2: migration `20261020000000`. Escrevo, não aplico; você aplica.
3. D1 (ADR 0008): antes do Grupo 4 mexer em `service_role`; D3 (apagar) antes do Grupo 9; D4 (expiração do token) antes do Grupo 6.
4. Grupos 7 e 8: migrations opcionais, cada uma com a verificação de dados antes.
5. Grupos 5, 6, 7 e 12 mexem em fluxo/UI vivos: passo a passo manual para você validar antes de eu seguir.

## Pedidos para arquivos compartilhados e de outros domínios (para o orquestrador)
- `lib/types/supabase.ts`: nada novo (a migration do Grupo 2 só cria trigger e função). `npm run db:types` só se a coluna `mentorship_topics`/policy mudar algo.
- `lib/types/models/mentorship.ts:5`: o tipo `AppointmentStatus` passa a vir de `lib/domain/appointments/appointment-status.entity.ts`. Arquivo de outra linha (mentors/mentorship).
- `lib/services/mentorship/mentorship.service.ts`: Grupo 9 remove os métodos mortos de sessão; coordenar com a linha de mentors (que tem o `mentorAvailabilityService` no mesmo arquivo).
- `lib/services/assistant/tools.ts` (linhas 319, 382, 453, 513, 579): as 4 tools de `appointments` consultam e atualizam o status por conta própria; devem chamar o `appointments.service` (Grupos 5 e 13). Linha do assistant.
- `app/api/cron/appointments/route.ts:60`: o update `pending → cancelled` passa a chamar `service.transition(id, "cancelled", "system", ...)` ou continua igual (já é condicional e cabe na tabela); decisão do dono do cron.
- `app/api/admin/appointments/**`, `app/api/dashboard/{mentee,mentor}`, `app/api/me/notifications`, `app/api/admin/stats`, `lib/ai-menvo/copilot/briefing.ts`, `lib/services/admin/overview.service.ts`, `lib/services/organizations/org-dashboard.service.ts`: só leem `appointments`; ficam como estão e passam a usar `AppointmentsRepository` quando cada linha decidir. Nenhum escreve `status`.
- `lib/query/keys.ts`, `lib/query/effects.ts` (Grupo 11), `lib/openapi/document.ts` (Grupo 10), `lib/agents/exposure.ts` (Grupo 13, só se liberar algo), `messages/*.json` (se a mensagem de "transição inválida" aparecer na UI): linhas exatas no relatório de cada grupo.
- `docs/STATUS.md` e `docs/blueprint/waves.md`: registrar cada PR e a Tarefa 3/6 no `hardening-plan.md` (tabela "Registro").

## Ordem resumida (um PR por linha)

| PR | Grupo | Camadas | Migration | Deixa o app funcionando porque... |
|---|---|---|---|---|
| 1 | 0a · cancel exige participante | 8 | não | só acrescenta uma checagem |
| 2 | 1 · entity + Zod do status | 3–4 | não | só adiciona arquivos e troca tipos |
| 3 | 2 · trigger de transição + pgTAP + docs | 1 | **sim** `20261020000000` | a tabela contém todo par que uma rota viva usa |
| 4 | 3 · repository | 5 | não | ainda sem chamador |
| 5 | 4 · ports + service + `mark-completed`, `no-show` | 6–8 | não | mesmas respostas, testes existentes intactos |
| 6 | 5 · `cancel`, `complete`, `list` | 7–8 | não | idem; único comportamento novo documentado |
| 7 | 6 · `confirm`, `feedback` + ADR 0008 | 7–8 | não | idem |
| 8 | 7 · `schedule`, `create` | 7–8 | opcional `20261020000100` | idem |
| 9 | 8 · `availability` | 5–8 | opcional `20261020000200` | idem |
| 10 | 9 · remoções e demais escritores | 5, 7 | não | só apaga o que não tem chamador |
| 11–14 | 10–13 · OpenAPI, query layer, componentes, agentes | 9–11, 14 | não | um PR por camada |
## Handoff (Grupo 9 remoções + D4 validade do token)

- Apagados (D3): `PATCH/DELETE /api/appointments/[id]`, `GET /api/appointments/schedule` (o POST ficou), `POST /api/appointments/action` e a página `app/[locale]/appointments/action`. Nenhum e-mail apontava para eles (`brevo.ts:346` usa `/appointments/confirm`).
- `mentorship.service.ts`: saem `requestSession`, `respondToSession`, `getMentorSessions`, `getMenteeSessions`, `completeSession`, `cancelSession`, `getSession`, `getMentorStats` e os tipos `SessionRequest`/`SessionResponse`. Saem também as entradas do OpenAPI (agora 11 operações) e os schemas Zod `actionAppointmentSchema`, `actionResponseSchema`, `scheduleListQuerySchema`, `patchAppointmentBodySchema`, `appointmentIdPathSchema`.
- D4: `create` e `schedule` gravam `token_expires_at = agora + 7 dias` (`actionTokenExpiry` na entity; `create` não gravava). `appointments.service.confirm` devolve `token_expired` para link vencido, só no caminho por token e só com o pedido `pending`; nulo = válido. A rota responde 410 `code: token_expired` com "Este link expirou...". O botão do painel não é afetado.
- Sem migration. Arquivos compartilhados: nenhuma alteração pedida (`messages/*.json`: a página de confirmação mostra `data.error` do servidor, sem chave nova).
- Falta: o grupo ainda deixa `admin-appointments.service` e os `.update` de `renewActionToken`/`pending_reminder` fora do repository.
