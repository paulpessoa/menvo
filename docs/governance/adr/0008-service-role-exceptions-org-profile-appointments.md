---
title: "ADR 0008 - service_role em org, profile e appointments: o que fica, onde mora e o que sai"
owner: paul
status: current
last_reviewed: 2026-10-19
source_of_truth: [docs/blueprint/org-audit.md, docs/blueprint/profile-audit.md, docs/blueprint/appointments-audit.md]
---

# ADR 0008 - service_role em org, profile e appointments

- **Status:** aceito (2026-10-20, merge da PR #126). As exceções da seção 3
  valem; o que está na seção 4 sai à medida que cada rota passa pelo service.
- **Relacionado:** ADR 0005 (convites), ADR 0007 (quiz), ADR 0006
  (arquitetura de referência), `docs/blueprint/waves.md` (onda 1).

## 1. Contexto

As auditorias da onda 1 acharam `service_role` sem ADR em 17 pontos de três
domínios. O padrão era "usei `service_role` para contornar uma RLS que eu não
sei qual é", e ele já causou uma falha real: `POST /api/appointments/cancel`
lia e gravava com `service_role` sem conferir se quem cancelava participava
da sessão (corrigido na PR #109).

O banco agora tem as respostas que faltavam (consultadas em produção em
2026-10-19): o participante tem policy de SELECT e UPDATE em `appointments`, e
o trigger `appointments_guard_update` (PR #117) recusa transição inválida e
troca de participante. Muitos desses usos deixaram de ser necessários.

## 2. Decisão: as regras

1. **Rota nunca importa o client `service_role`.** Ele nasce só em
   `lib/services/<domínio>/<domínio>.composition.ts`, de forma preguiçosa
   (o build roda sem segredos), e entra no service como um repository ou port
   com nome que diz o privilégio (`adminRepo`, `OrgDirectory`, `contacts`).
2. **Quem age vem sempre da sessão ou de um token assinado,** nunca do corpo
   da requisição. Toda escrita privilegiada filtra pelo id que veio de lá.
3. **O service confere o ator antes de usar o privilégio.** O banco não sabe
   quem está por trás de uma chamada `service_role`, então a checagem de
   "é participante / é o mentor / é admin da org" é obrigatória no service e
   tem teste (o caso do `cancel` virou o teste modelo).
4. **Leitura privilegiada devolve o mínimo:** e-mail e nome da outra parte,
   nunca a linha inteira de `profiles`.

## 3. Exceções aceitas

| # | Onde | Por que precisa | Até quando |
|---|---|---|---|
| E1 | Apagar conta (`profile/delete` → `deleteUserCompletely`) | `auth.users` só se apaga pela Admin API | Permanente |
| E2 | Trocar papel (`profile/role`, `profile/stop-mentor`) | A escrita em `user_roles` foi fechada para usuário comum de propósito (`20261003030000`, escalada para admin) | Até a RPC `set_my_role` (migration futura M1) |
| E3 | Contato da outra parte para e-mail e Calendar (`appointments` confirm/cancel/no-show, aviso aos admins da org ao pedir para entrar) | A RLS de `profiles` não deixa ver o e-mail de terceiros, e não deve deixar | Até RPCs de contato (M2); o e-mail nunca volta ao cliente |
| E4 | Convite de org por e-mail (`org/[id]/members` POST) | Achar a conta de quem ainda não é membro; a RLS só mostra membros | Permanente. **Risco aceito:** o convite responde de forma diferente se o e-mail tem conta, o que funciona como oráculo para admins de org. Aceitável enquanto só há orgs parceiras |
| E5 | Fluxos por token do e-mail (`appointments/confirm` com token) | Quem clica no e-mail não tem sessão; o token é a credencial | Permanente, com validade do token respeitada (decisão D4 de appointments) |
| E6 | Horários ocupados no perfil público (`appointments/availability`) | Visitante precisa saber o que está ocupado, e `appointments` não tem leitura para `anon` | Até a RPC `mentor_busy_slots` (M3), que devolve só horário e duração |
| E7 | Cron e painel admin | Rodam sem sessão de usuário ou para qualquer usuário | Permanente; já usam update condicional por status |
| E8 | Lead de organização (`organization_leads` insert) | Não há policy de insert público | Até avaliar uma policy de insert com rate limit |

## 4. O que sai (volta para a sessão do usuário)

| Onde | Por quê dá |
|---|---|
| `GET/PUT /api/profile`, `profile/onboarding` | É o próprio perfil. `/api/auth/me` já lê o mesmo com a sessão. Sai depois que o pgTAP `profile_own_writes` provar o INSERT e o UPDATE de `slug` |
| `appointments` complete, mark-completed e a escrita do cancel | O participante tem policy de UPDATE e o trigger guarda a transição. `assistant/tools` já faz o mesmo com a sessão |
| `appointments/feedback` PATCH | Editar a própria avaliação: basta uma policy de update do `reviewer_id` |
| Bearer em `/api/profile` e `onboarding` | Nenhum chamador envia `Authorization`. Sai depois de conferir os logs da Vercel |

## 5. Migrations futuras (uma onda própria, uma linha só)

- **M1** `set_my_role(role)` security definer, com `unique(user_id, role_id)` em
  `user_roles` (conferir duplicatas antes).
- **M2** contato da outra parte de uma sessão e e-mails dos admins de uma org,
  só para quem tem direito, sem expor o e-mail ao cliente.
- **M3** `mentor_busy_slots(mentor, de, até)`.
- Versionar `user_favorites` (a tabela e a RLS existem em produção, mas não
  numa migration).

## 6. Alternativas consideradas

- **Trocar tudo por RPC agora:** tira o privilégio de vez, mas são 4+
  migrations de segurança numa onda que já tem o trigger de appointments.
  Rejeitado por ora; fica como M1–M3.
- **Abrir a RLS de `profiles` para "par de sessão" ler o e-mail:** o e-mail
  passaria a chegar ao navegador do outro participante. Rejeitado.
