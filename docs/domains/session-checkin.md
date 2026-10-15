# Check-in pós-sessão: saber se a mentoria aconteceu

> **Status:** implementado em 2026-10-15 (Opus, todas as fases), branch
> `docs/session-checkin-spec`. Migration `20261015010000_appointment_checkins.sql`
> **ainda não aplicada** em produção.
> **Desvios da especificação original:** ver §9.

## 1. Problema

Hoje uma sessão `confirmed` fica `confirmed` para sempre, a menos que alguém
entre na plataforma e clique em "concluir". Na prática ninguém clica:

- Em 2026-10-15, das sessões passadas, nenhuma tinha `completed_at`, e o único
  pedido de feedback enviado não teve resposta.
- O pedido de feedback (`sendFeedbackRequest`, cron diário) só vai para o
  mentorado, exige login e só pergunta "como foi", nunca "aconteceu?".
- O mentor nunca é perguntado.
- Quem cancela dizendo "vou reagendar" (caso Polianna/Bianca, 07/10) some da
  plataforma; se a conversa acontece por fora, ninguém fica sabendo.

Sem saber **se** a sessão aconteceu, não dá para medir feedback, avanço do
mentorado, horas voluntárias (C-T3) nem o relatório de impacto (C-O3).

## 2. Objetivo

Um e-mail para **cada lado** depois da sessão, com uma pergunta e três botões
que funcionam **sem login**:

> **A mentoria com {nome} aconteceu?**
> [Sim, aconteceu] [Não rolou] [Remarcamos]

A resposta muda o status da sessão. O "Sim" do mentorado abre a avaliação
(nota + próximo passo) na mesma página, sem login.

**Métrica de sucesso:** % de sessões passadas com desfecho conhecido
(hoje ~0%). Meta inicial: 70% em 30 dias.

## 3. Regras de negócio

1. **Quando enviar:** no cron diário de `/api/cron/appointments` (07:00 de
   Recife), para toda sessão `confirmed` que terminou (`scheduled_at +
   duration_minutes`) há pelo menos 2h e ainda não tem check-in enviado.
   Na prática chega na manhã seguinte. Se o plano da Vercel permitir cron por
   hora, o mesmo código passa a enviar ~2h depois sem mudança de regra.
2. **Para quem:** mentor e mentorado, um e-mail e um token cada.
   **Substitui** o `sendFeedbackRequest` atual (não mandar os dois).
3. **Lembrete:** um único lembrete 3 dias depois para quem não respondeu.
   Depois disso, para. O token vale 14 dias.
4. **Respostas e efeito na sessão** (função pura `resolveCheckin`, testada):

   | Mentor | Mentorado | Efeito |
   |---|---|---|
   | aconteceu | aconteceu / sem resposta | `completed`, `completed_at = now()` |
   | sem resposta | aconteceu | `completed` |
   | não rolou | não rolou / sem resposta | `cancelled`, motivo "não aconteceu (check-in)" |
   | sem resposta | não rolou | `cancelled`, idem |
   | remarcamos (qualquer lado) | – | `cancelled`, motivo "remarcada (check-in)"; o mentorado recebe link para agendar de novo com o mesmo mentor |
   | aconteceu | não rolou (ou o inverso) | **conflito**: status não muda; aparece no painel admin para o Paul resolver |

   Uma resposta que já mudou o status não é desfeita por outra posterior, a
   não ser no caso de conflito (que congela e vai para o admin).
5. **No-show:** "não rolou" dito pelo mentor equivale ao `no-show` atual, mas
   sem e-mail de cancelamento automático para o mentorado (o tom do check-in
   é de pergunta, não de acusação).
6. **Avaliação no "Sim" do mentorado** (opcional, mesma página):
   nota 1–5, comentário público (vai para moderação como hoje, `status =
   pending`) e **"Qual vai ser seu próximo passo?"** (texto curto, privado,
   base do follow-up de 30 dias, item 3 do roadmap).
7. **Nota do mentor no "Sim"** (opcional): "Como você viu {nome}?", privada,
   vai para `notes_mentor`.

## 4. Bloqueio de novo agendamento (decisão do Paul, 2026-10-15)

O Paul propôs: só deixar agendar outra mentoria depois de concluir/avaliar a
anterior. **Recomendação: bloquear só pela pergunta de 1 clique, nunca pela
avaliação.**

- Ao abrir o modal de agendamento, se o mentorado tem uma sessão passada
  (últimos 30 dias, terminada há mais de 2h) sem resposta dele no check-in,
  o modal mostra primeiro "A mentoria com {mentor} em {data} aconteceu?"
  com os três botões. Respondeu, segue para o agendamento.
- **Não** exigir nota nem comentário para agendar: a avaliação continua
  opcional. Exigir avaliação gera nota falsa ("5 só pra passar") e pune o
  mentorado quando foi o mentor quem faltou.
- Sessões com mais de 30 dias não bloqueiam (evita travar quem volta depois
  de meses).
- A API (`/api/appointments/schedule`) aplica a mesma regra e devolve 409
  com `{ code: "pending_checkin", appointmentId }`, para o bloqueio não
  depender só da interface.

## 5. Modelo de dados (Fase 1, Opus)

Migration `appointment_checkins` (expand, sem mexer nas colunas atuais):

```sql
create table public.appointment_checkins (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('mentor', 'mentee')),
  token_hash text not null unique,          -- sha256 do token; o token em si só existe no e-mail
  expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  reminded_at timestamptz,
  outcome text check (outcome in ('happened', 'not_happened', 'rescheduled')),
  answered_at timestamptz,
  next_step text check (char_length(next_step) <= 500),
  unique (appointment_id, role)
);
alter table public.appointments add column checkin_conflict boolean not null default false;
```

- **RLS:** participante lê a própria linha; admin lê tudo. Nenhuma policy de
  escrita para `anon`/`authenticated`.
- **Escrita sem login sem `service_role`:** duas RPCs `security definer`,
  `grant execute ... to anon, authenticated`:
  - `answer_session_checkin(p_token text, p_outcome text)` → confere
    hash + validade, grava a resposta, aplica a tabela da §3.4 dentro da
    mesma transação e devolve só `{ outcome, role, other_first_name,
    scheduled_at, can_rate }`.
  - `rate_session_from_checkin(p_token text, p_rating int, p_public text,
    p_next_step text)` → só para `role = 'mentee'` com `outcome =
    'happened'`; insere em `appointment_feedbacks` (`status = 'pending'`)
    e grava `next_step`. Uma vez por token.
- O cron (servidor, já usa service role para varrer sessões) cria as linhas
  e gera os tokens com `crypto.randomBytes(32)`.

## 6. Superfícies (Fases 2–4, Sonnet)

- **Fase 2 – cron e e-mails:** passo novo no cron de appointments (envio +
  lembrete), template `sendSessionCheckin` no `brevo.ts` com os três botões
  apontando para `/checkin/{token}?r=happened|not_happened|rescheduled`.
  Remove o passo de `sendFeedbackRequest`.
- **Fase 3 – página `/checkin/[token]`:** server component que chama a RPC
  com a resposta da URL (o clique no e-mail já é a resposta), mostra
  "obrigado" e, para o mentorado que disse "Sim", o formulário de avaliação
  (React Hook Form + Zod). Token inválido/expirado → mensagem e link para
  login. Mostra só primeiro nome e data.
- **Fase 4 – admin e bloqueio:** colunas "check-in mentor/mentorado" e
  filtro "conflito" no painel de agendamentos do admin; bloqueio da §4 no
  modal e na API.

## 7. Testes

- `resolveCheckin` (pura): todas as linhas da tabela §3.4, inclusive
  resposta tardia depois de status já resolvido.
- RPCs: token errado, expirado, já respondido, papel errado para avaliar.
- Cron: não envia duas vezes; lembrete só uma vez; não envia para sessão
  `cancelled`/`pending`.
- Schedule: 409 `pending_checkin` com sessão passada sem resposta; libera
  depois de responder; não bloqueia sessão com mais de 30 dias.

## 8. Fora do escopo (próximos itens do roadmap)

- Follow-up de 30 dias ("você avançou no seu próximo passo?").
- Link de reagendar no cancelamento manual (hoje só no "remarcamos").
- Painel de funil agendada → aconteceu → avaliou → avançou.

## 9. Como ficou (2026-10-15)

- **Dois cliques, não um.** O botão do e-mail abre `/checkin/[token]?r=...`
  com a opção já destacada, e a resposta só é gravada no clique na página.
  Motivo: scanners de e-mail corporativo abrem todos os links do e-mail, e
  com "a primeira resposta vale" o scanner responderia no lugar da pessoa.
  Mesmo cuidado de `/convite/[token]`.
- **Lembrete gira o token.** Só o hash fica no banco, então o lembrete leva um
  token novo e o link do primeiro e-mail deixa de valer (a página explica).
- **"Remarcamos" do mentor não manda e-mail ao mentorado.** O link para
  escolher novo horário aparece na página só para o mentorado que respondeu
  "remarcamos". O aviso automático fica para o item "cancelamento com
  reagendamento" do roadmap.
- **O bloqueio antigo do modal foi trocado.** `BookMentorshipModal` bloqueava
  quem tinha qualquer sessão `completed` sem avaliação completa (só na
  interface). Com o check-in, mais sessões viram `completed`, então isso
  travaria muita gente. Agora o modal e as duas APIs de agendamento
  (`/schedule` e `/create`) exigem só o "aconteceu?" (§4). O lembrete de
  avaliar continua no dashboard do mentorado.
- **Arquivos:** regra pura em `lib/domain/appointments/session-checkin.entity.ts`;
  envio em `lib/services/appointments/session-checkin.service.ts`; respostas em
  `lib/services/appointments/checkin-responses.service.ts` e
  `app/actions/session-checkin.ts`; página em `app/[locale]/(auth)/checkin/[token]/`;
  bloqueio em `components/mentorship/PendingCheckinPrompt.tsx`; admin com abas
  "Sem check-in" e "Check-in em conflito" em `/dashboard/admin/appointments`.
- **Testes:** `supabase/tests/appointment_checkins.test.sql` (16 casos, rodados
  no banco de produção dentro de uma transação desfeita), mais Jest para a
  regra de envio, o serviço de respostas, o cron, as rotas e o admin.

