---
title: "ADR 0007 - service_role no quiz: criar conta e enviar o e-mail de resultado"
owner: paul
status: current
last_reviewed: 2026-10-07
source_of_truth: [lib/services/quiz/quiz.server.service.ts, lib/services/quiz/quiz.composition.ts, lib/ports/adapters/account-provisioner.supabase.ts, app/api/quiz/[id]/account/route.ts, app/api/quiz/[id]/send-email/route.ts]
---

# ADR 0007 - service_role no quiz: criar conta e enviar o e-mail de resultado

- **Status:** implementado (2026-10-07).
- **Relacionado:** ADR 0005 (mesma lógica de exceção), ADR 0006 (arquitetura de referência), `docs/blueprint/quiz-audit.md`.

## 1. Contexto

O quiz é anônimo por desenho: quem responde não tem sessão, e a tabela
`quiz_responses` não tem policy de leitura para `anon`. Dois fluxos precisam
agir sobre uma linha dessas sem sessão e não cabem em RLS:

1. **Salvar a análise numa conta** (`/api/quiz/[id]/account`): lê a linha para
   conferir o token do link do e-mail e cria o usuário com `auth.admin.createUser`,
   que só existe com `service_role`. Depois vincula o `user_id` à linha.
2. **E-mail de resultado** (`sendResults`): lê o nome, o e-mail e a análise da
   linha, e marca `email_sent`. O e-mail nunca vem do chamador, só da linha.

`AGENTS.md` proíbe `service_role` como atalho em funcionalidade de usuário;
este ADR registra as exceções, como o ADR 0005 fez para convites.

## 2. Decisão

Usar `service_role` nesses dois fluxos, com estes limites:

1. **Só dentro do service do quiz.** O acesso privilegiado nasce em
   `quiz.composition.ts`, de forma preguiçosa (o build roda sem segredos), e é
   entregue ao service como `adminRepo` e `accounts`. Nenhuma rota importa o
   client `service_role`.
2. **As rotas só aceitam o `id` do quiz e, para conta, o token `k`.** O token é
   assinado (`lib/quiz/result-link.ts`) sobre `id + e-mail + validade`: prova que
   a pessoa recebeu o e-mail. Nunca um `userId` nem um e-mail vindo do cliente.
3. **Criar conta exige a senha escolhida na hora**; abrir o link sozinho não cria
   nada. O vínculo é `update ... where user_id is null`, então um replay não
   troca o dono.
4. **O e-mail só vai para o endereço da própria linha.**

## 3. Risco aceito: `send-email` usa o `id` como única credencial

`POST /api/quiz/[id]/send-email` não pede sessão nem token: quem souber o UUID
(que aparece no link público de resultado) pode pedir o reenvio, e o e-mail
chega ao dono da linha. O dano é spam limitado: o conteúdo é o resultado do
próprio dono, o limite é 3 envios por 10 minutos por `id` (em memória, por
instância) e o reenvio só funciona se a análise já está pronta.

Aceito por ora porque a alternativa (exigir o token `k`) quebra o botão
"reenviar" na página pública de resultado, que não guarda o token de propósito.
**Reavaliar** se aparecer abuso: a saída é limitar por `id` no banco, não em memória.

## 4. Alternativas consideradas

- **RPC `security definer` para ler a linha no e-mail:** funcionaria sem
  `service_role`, mas é uma migration nova para um ganho pequeno, e a criação de
  conta continuaria precisando de `auth.admin`. Rejeitado por ora.
- **Exigir login para salvar a análise:** rejeitado, derrotaria o objetivo do
  fluxo (criar a conta a partir do quiz anônimo).
