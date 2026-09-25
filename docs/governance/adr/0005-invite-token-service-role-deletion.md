---
title: "ADR 0005 — service_role para exclusão de conta via token de convite, sem login"
owner: paul
status: current
last_reviewed: 2026-09-27
source_of_truth: [lib/services/invites/invite-token.service.ts, lib/services/admin/delete-user.service.ts, app/api/invites/respond/route.ts, app/api/invites/delete/route.ts]
---

# ADR 0005 — service_role para exclusão de conta via token de convite, sem login

- **Status:** implementado (2026-09-27).
- **Plano:** `docs/domains/reengagement-invites.md` §3.3.

## 1. Contexto

`AGENTS.md` proíbe usar `service_role` como atalho em funcionalidade de
usuário ("Never suggest `service_role` as a shortcut for user-facing
features"). O fluxo de convites de reengajamento (base JotForm/Estágio
Recife) precisa, no entanto, de duas ações que uma pessoa **sem sessão**
deve poder disparar a partir de um link de e-mail:

1. Gerar um link de login válido ao aceitar o convite.
2. Apagar definitivamente sua própria conta, caso não queira participar
   (LGPD art. 18, VI).

Nenhuma das duas é possível com um cliente autenticado por RLS, porque não
existe uma sessão — a pessoa não fez login, só clicou em um link.

## 2. Decisão

Usar o cliente `service_role` (`createServiceRoleClient()`) nesses dois
pontos, mas com três limites que mantêm isso como uma exceção controlada
e não um atalho genérico:

1. **O acesso privilegiado fica só dentro de dois serviços**
   (`invite-token.service.ts`, `delete-user.service.ts`), nunca espalhado
   pelas rotas ou por outro código de UI.
2. **As rotas públicas só aceitam `{ token }`** (`POST /api/invites/respond`,
   `POST /api/invites/delete`) — nunca um `userId` vindo do cliente. O
   `user_id` usado nas escritas vem exclusivamente do registro do token,
   resolvido em `resolveInviteToken()`. Isso significa que essas rotas não
   podem, mesmo com um `service_role` por trás, ser apontadas para uma
   conta arbitrária: só conseguem agir sobre a conta que o próprio token
   (enviado por e-mail à pessoa dona daquela conta) identifica.
3. **A ação é de uso único.** `markResponse()` só grava uma resposta se o
   convite ainda não tinha uma (`UPDATE ... WHERE response IS NULL`), então
   um replay do POST não pode disparar uma segunda exclusão nem sobrescrever
   uma resposta anterior.

Comparação com o restante do produto: em todo o resto do Menvo, RLS por
sessão é o caminho por padrão, e `service_role` só aparece em operações que
já são, por natureza, administrativas ou de sistema — convites em massa,
aprovação de organização, jobs de retenção. Este fluxo se encaixa na mesma
categoria (é um gatilho de e-mail que o próprio sistema originou, não uma
ação de UI livre do usuário dentro do app), só que o "administrador" aqui é
o token, não uma sessão de admin.

## 3. Alternativas consideradas

- **Fazer login automático antes de qualquer ação:** rejeitado — o
  objetivo explícito é deixar a pessoa recusar/apagar **sem** precisar
  criar uma sessão, exatamente o cenário que a LGPD pede para ficar simples.
- **RLS com uma policy que aceita o hash do token como credencial:**
  Postgres RLS não tem como validar um token de aplicação arbitrário sem
  reimplementar a lógica de hash/expiração dentro de SQL (`current_setting`
  customizado, checagem de assinatura, etc.) — mais frágil e mais difícil
  de auditar do que manter a validação em TypeScript, no único lugar que já
  centraliza como o token é gerado.

## 4. Consequência

Qualquer revisão de código deste fluxo deve conferir que a regra 2
continua valendo: nenhuma rota pública sob `/api/invites/*` pode ganhar um
parâmetro que permita escolher a conta afetada — o token é sempre a única
fonte do `user_id`.
