# E-mails de ciclo de vida (automáticos, periódicos e manuais)

> Status: **plano** (nada implementado ainda). Visual do fluxo: [`lifecycle-emails.html`](./lifecycle-emails.html).
> Restrição do MVP: **custo zero** — Brevo Free + Supabase Free + Vercel Hobby.

## 1. Objetivo

Organizar a comunicação por e-mail da Menvo em três trilhas, inspiradas em plataformas de mentoria maduras
(boas-vindas, objetivos de carreira, novidades, conteúdo, indicação, marcos, incidentes, reengajamento):

| Trilha | Quem dispara | Exemplo |
|---|---|---|
| **A. Transacional** | Evento do sistema (já existe) | Confirmação de conta, sessão confirmada, lembrete de sessão |
| **B. Ciclo de vida (automático)** | Cron diário lê o estado do usuário | Boas-vindas D0, "falta pouco" D3, metas de carreira D7 |
| **C. Broadcast (manual)** | Paul, pelo painel admin, guiado por lembrete no Google Calendar | Novidades do mês, conteúdo, indicação, marcos, incidente |

## 2. O que já existe (reaproveitar, não duplicar)

- `lib/email/brevo.ts`: `sendEmail()` via API transacional do Brevo, layout com design system, assinatura `personal` (Paul) ou `none`, ~20 templates.
- `app/[locale]/dashboard/admin/emails`: preview + envio de teste de templates.
- `lib/services/invites/*` + tabela `reengagement_invites`: envio em massa por campanha (`unique(user_id, campaign)` evita duplicidade) + token de resposta.
- `lib/services/invites/suppression.service.ts` + `email_suppressions`: lista de não-contato por hash (LGPD).
- `newsletter_subscriptions` com `marketing_consent`.
- Crons Vercel (`vercel.json`): `appointments` (10h UTC), `ai-retention`, `account-retention` — padrão `CRON_SECRET` fail-closed em `app/api/cron/account-retention/route.ts`.
- Templates de Auth do Supabase em `supabase/templates/` (confirmação de e-mail, magic link etc.).
- `pg_net` já usado no trigger `notify_new_user_role` (chama Edge Function).

## 3. Limites gratuitos (o que manda no desenho)

Consultado na conta Brevo em 2026-10-01: plano `free`, `sendLimit` = **300/dia** (294 restantes no momento), Marketing Automation habilitado, relay SMTP `smtp-relay.brevo.com:587` ativo.

| Serviço | Limite relevante | Consequência no plano |
|---|---|---|
| **Brevo Free** | 300 e-mails/dia **somando** transacional + campanhas; contatos ilimitados; campanhas de marketing saem com logo Brevo; automação limitada (verificar teto de contatos no painel) | Precisamos de **orçamento diário** e **fila com prioridade**. Broadcasts para base > ~150 pessoas viram envio em lotes de vários dias. |
| **Supabase Free** | `pg_cron` e `pg_net` disponíveis; 500 MB de banco; Edge Functions 500k invocações/mês; projeto **pausa após 7 dias sem atividade**; SMTP padrão do Auth é só para teste (poucos e-mails/hora) | Auth deve usar o **SMTP do Brevo** (custom SMTP) — esses e-mails também contam nos 300/dia. Fila mora no Postgres. |
| **Vercel Hobby** | Cron só **1x por dia** por job, horário impreciso dentro da hora | Usar um único cron diário `/api/cron/lifecycle-emails`; se precisar de mais frequência, `pg_cron` + `pg_net` chamando a mesma rota (grátis). |

### Orçamento diário sugerido (300)

| Fatia | Cota | Observação |
|---|---|---|
| Reserva transacional (Auth + agendamentos) | 100 | Nunca é bloqueada; é a margem de segurança |
| Ciclo de vida automático (trilha B) | 80 | Cron diário |
| Broadcast manual (trilha C) | 100 | Drena a fila em lotes |
| Folga (testes, reenvios) | 20 | |

> Regra: a fila só envia trilhas B/C se `enviados_hoje < 300 - reserva_transacional`. O contador vem da tabela `email_sends` (seção 5), não da API do Brevo, para não gastar chamadas.

### ⚠️ Pendências de configuração encontradas

1. O único remetente cadastrado no Brevo é **"Lista Pronta" <paulmspessoa@gmail.com>**. O código usa `BREVO_SENDER_EMAIL` (fallback `contato@menvo.com.br`). Confirmar no Brevo que o **domínio `menvo.com.br` está autenticado** (DKIM + DMARC) e criar o remetente "Menvo <contato@menvo.com.br>"; sem isso, Gmail/Yahoo tendem a mandar para spam.
2. Configurar no Supabase (Auth → SMTP Settings) o relay do Brevo para os e-mails de confirmação de conta.
3. Separar remetentes: `contato@` (institucional) e `paul@` (pessoal, com `replyTo` para o Gmail do Paul).

## 4. Catálogo de e-mails (inspiração → Menvo)

Legenda: **Auto** = cron/evento · **Manual** = Paul dispara pelo admin · **Existe** = já implementado.
Público: `T` transacional (não precisa de opt-in) · `R` relacionamento (opt-out por link) · `M` marketing (exige `marketing_consent`).

| # | Categoria | E-mail Menvo | Gatilho / cadência | Tipo | Público | Assinatura |
|---|---|---|---|---|---|---|
| 1 | Boas-vindas | Verificação de conta | Cadastro (Supabase Auth) | **Existe** | T | none |
| 2 | Boas-vindas | Boas-vindas institucional (o que é a Menvo, 3 próximos passos por papel mentor/mentee) | D0 após confirmar e-mail | Auto | T | none |
| 3 | Boas-vindas | Mensagem pessoal do Paul (texto curto, "responda este e-mail") | D1, horário comercial | Auto | R | personal |
| 4 | Objetivos | "Defina seu objetivo de carreira" → quiz/diagnóstico IA | D3 se `learning_goals` vazio e sem quiz | Auto | R | none |
| 5 | Objetivos | "Encontre mentores para o seu objetivo" (3 sugestões do match) | D7 se mentee sem agendamento | Auto | R | none |
| 6 | Reengajamento | "Falta pouco!" perfil incompleto (mentor sem bio/disponibilidade) | D2 e D7 se `community_ready = false` | Auto | R | personal |
| 7 | Reengajamento | "Sentimos sua falta" | 30 dias sem login, máx. 1x/trimestre | Auto | R | personal |
| 8 | Novidades | Novidades do mês (changelog: assistente IA, agendamento etc.) | Mensal, 1ª terça | Manual | M | personal |
| 9 | Conteúdo | Guia prático / artigo da KB (ex.: "Como aproveitar sua 1ª mentoria") | Quinzenal | Manual | M | none |
| 10 | Campanhas | Evento/mentoria coletiva + "última chamada" | Por evento: D-7 e D-1 | Manual | M | personal |
| 11 | Indicação | "Indique um mentor / convide um amigo" | Auto após 1ª sessão concluída + manual trimestral | Auto + Manual | R/M | personal |
| 12 | Marcos | "Chegamos a 100 mentores verificados" | Quando um marco é atingido (cron avisa o Paul) | Manual | M | personal |
| 13 | Incidentes | Nota de esclarecimento pós-instabilidade | Sob demanda (template pronto) | Manual | T/R | personal |

> Cursos pagos com desconto (categoria "promoções") ficam **fora do MVP**; o equivalente gratuito é o #10 (eventos).

## 5. Arquitetura proposta

```
evento/cron ──► enqueue() ──► email_outbox (fila, prioridade, dedupe_key)
                                   │
          cron diário / pg_cron ───┤  drain(): respeita orçamento + supressão + preferências
                                   ▼
                         sendEmail() Brevo ──► email_sends (log, contador diário)
```

### 5.1 Tabelas novas (uma migração)

- `email_outbox`: `id, user_id, email, template_key, payload jsonb, priority smallint (0=transacional,1=lifecycle,2=broadcast), campaign text, dedupe_key text unique, scheduled_for timestamptz, status ('queued','sent','skipped','failed'), attempts, last_error, created_at, sent_at`.
  `dedupe_key` = `template_key:user_id[:campanha]` → impede mandar a mesma boas-vindas duas vezes.
- `email_sends` (ou reaproveitar `email_outbox` com `status='sent'`): base do contador `count(*) where sent_at::date = today`.
- `email_preferences`: `user_id, relationship boolean default true, marketing boolean default false, updated_at` + token de unsubscribe. Complementa `email_suppressions` (supressão total).
- RLS: leitura só admin; usuário lê/edita a própria `email_preferences`. Escritas da fila só via service role (mesmo padrão de `reengagement_invites`).

### 5.2 Código

- `lib/email/lifecycle/` — templates novos usando `getEmailLayout` (exportar o layout de `brevo.ts` em vez de copiar).
- `lib/services/email-queue/` — `enqueue()`, `drain({ budget })`, `getDailyBudget()`; testes Jest no padrão dos serviços de retenção.
- `lib/services/lifecycle/` — regras "quem recebe hoje" (consultas por coorte D0/D1/D3/D7/D30), cada regra = função pura testável.
- `app/api/cron/lifecycle-emails/route.ts` — 1x/dia: (1) enfileira coortes, (2) drena fila. Modo `dry_run`/`live` por env, como `account-retention`.
- Admin `dashboard/admin/emails`: aba **Campanhas** (escolher template + público + agendar) e **Fila/Orçamento** (enviados hoje / 300).
- Rodapé: link "gerenciar e-mails" + header `List-Unsubscribe` nos tipos R/M.

## 6. Fases (PRs pequenos)

1. **Config & entregabilidade** — domínio autenticado, remetente Menvo, SMTP do Auth no Brevo. *(sem código)*
2. **Fila + orçamento** — migração `email_outbox`/`email_preferences`, serviço de fila, cron `lifecycle-emails` em `dry_run`.
3. **Boas-vindas (#2, #3)** — enqueue no primeiro login/confirmação; ligar `live`.
4. **Reengajamento e objetivos (#4–#7)** — regras por coorte + testes.
5. **Broadcast pelo admin (#8–#13)** — aba Campanhas, envio em lotes respeitando cota, preferências/unsubscribe.
6. **Métricas** — abrir/clicar via webhooks do Brevo (gratuito) gravando em `email_sends`.

## 7. Rotina manual do Paul (Google Calendar)

| Lembrete | Recorrência | Ação |
|---|---|---|
| 📰 Novidades do mês (#8) | Mensal, 1ª terça 10h | Escrever 3 novidades + enviar campanha |
| 📚 Conteúdo (#9) | Quinzenal, quinta 10h | Escolher 1 artigo da KB e enviar |
| 🤝 Indicação (#11) | Trimestral | Campanha "indique um mentor" |
| 📊 Revisar orçamento e métricas | Semanal, segunda 9h | Ver fila, bounces, descadastros |
| 🎉 Marcos (#12) / 🛠 Incidente (#13) | Sob demanda | Template pronto no admin |

Dica: campanhas grandes → agendar para **terça a quinta, 9h–11h (America/Recife)**; base > 200 contatos → a fila divide em dias.

## 8. Decisões pendentes do Paul

1. Remetente pessoal: `paul@menvo.com.br` existe? Respostas vão para o Gmail?
2. Usuários atuais recebem as boas-vindas retroativamente ou só os novos?
3. Opt-in de marketing: perguntar no onboarding (checkbox) ou só via newsletter?
4. Tom do e-mail pessoal: o Paul escreve o texto base do #3?
