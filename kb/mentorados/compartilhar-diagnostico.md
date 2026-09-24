---
id: compartilhar-diagnostico
title: Compartilhamento Seguro de Diagnóstico com o Mentor
audience: [all]
tags: [compartilhamento, privacidade, lgpd, mentor, diagnostico]
summary: Saiba como compartilhar seu relatório de diagnóstico com seu mentor e como revogar o acesso a qualquer momento respeitando a LGPD.
status: current
last_reviewed: 2026-09-24
source_of_truth: [lib/services/diagnostic/diagnostic-shares.service.ts, supabase/migrations/20260924000002_diagnostic_shares.sql]
links:
  - label: Ver Meu Diagnóstico
    url: /assistant
---

# Compartilhamento Seguro do Diagnóstico

Por padrão, seu Diagnóstico de Carreira é **100% privado** e protegido por políticas de segurança estritas (RLS). Nenhum mentor tem acesso aos seus dados a menos que você decida compartilhar expressamente.

## Como Compartilhar com um Mentor

1. Acesse o seu relatório em `/quiz/results/[id]`.
2. Clique no botão **"Compartilhar com Mentor"**.
3. Selecione o mentor para o qual deseja conceder acesso.
4. Escolha o escopo de compartilhamento:
   - **Resumo Profissional (Recomendado):** Compartilha seus objetivos, áreas de interesse e análise de IA, **omitindo** detalhes pessoais da pergunta 6 para proteger sua privacidade conforme a LGPD.
   - **Diagnóstico Completo:** Compartilha todas as respostas fornecidas no diagnóstico.
5. Clique em **"Confirmar Compartilhamento"**.

## O que o Mentor Visualiza?
O mentor selecionado poderá visualizar o seu diagnóstico em modo somente-leitura nas telas `/mentor/appointments` e no Dashboard do Mentor (`/dashboard/mentor`), facilitando a preparação para a sessão.

## Revogação de Acesso
Você pode **revogar o acesso a qualquer momento** clicando em "Gerenciar Compartilhamento" e revogando a permissão. O mentor deixará de visualizar o relatório instantaneamente.
