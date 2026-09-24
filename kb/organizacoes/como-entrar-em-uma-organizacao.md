---
id: como-entrar-em-uma-organizacao
title: Como entrar ou se vincular a uma organização parceira
audience: [all]
tags: [organizacoes, convites, membros, solicitacao, adesao]
summary: Saiba como aceitar convites de ONGs parceiras ou solicitar entrada em uma organização pelo seu perfil.
status: current
last_reviewed: 2026-09-24
source_of_truth: [docs/domains/organizations.md, app/api/me/organizations/route.ts]
links:
  - label: Minhas Organizações
    url: /profile?tab=organizations
---

# Como Entrar em uma Organização Parceira

Se você faz parte de uma ONG, projeto social ou empresa parceira da Menvo, existem dois caminhos para se vincular:

## 1. Através de Convite por E-mail
- O administrador da organização enviará um convite para o seu e-mail cadastrado.
- Ao clicar no link do convite ou acessar `/profile?tab=organizations`, você verá o convite pendente.
- Basta clicar em **"Aceitar Convite"** para ser imediatamente vinculado ao hub daquela organização.

## 2. Solicitando Adesão pela Página da Organização
- Para organizações com política aberta (`join_policy: open`), acesse a página pública da entidade em `/organizations/[slug]`.
- Clique no botão **"Solicitar Entrada"**.
- O status da sua solicitação ficará como `requested` até que um administrador da organização aprove seu ingresso no painel de membros.
