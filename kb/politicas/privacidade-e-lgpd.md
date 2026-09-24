---
id: privacidade-e-lgpd
title: Privacidade de dados e conformidade com a LGPD
audience: [all]
tags: [privacidade, lgpd, dados, seguranca, retencao, protecao]
summary: Como a Menvo protege seus dados, gerencia permissões (RLS) e aplica políticas de retenção conforme a Lei Geral de Proteção de Dados.
status: current
last_reviewed: 2026-09-24
source_of_truth: [docs/governance/ai-policy.md, docs/AI_PLATFORM_PLAN.md]
links:
  - label: Política de Privacidade
    url: /privacy
---

# Privacidade de Dados e LGPD na Menvo

A Menvo leva a segurança e a privacidade dos seus dados muito a sério, em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018):

## Nossos Compromissos de Proteção

1. **Privacidade por Padrão (Privacy by Default):**
   - Respostas do Diagnóstico de Carreira e conversas com a IA são restritas exclusivamente ao seu usuário logado por meio de políticas de banco de dados (Row Level Security - RLS).
   - Nenhum mentor ou usuário externo tem acesso às suas análises sem seu consentimento explícito.
2. **Minimização de Dados e PII:**
   - Chamadas de IA nunca enviam dados sensíveis de contato (como telefone, e-mail completo ou CPF) para modelos externos.
   - O escopo padrão de compartilhamento de diagnóstico com mentores omite automaticamente o campo de contexto pessoal para resguardar sua vida privada.
3. **Ciclo de Vida e Retenção Automatizada:**
   - Sessões incompletas de diagnóstico com mais de 30 dias de inatividade são expurgadas automaticamente.
   - Compartilhamentos revogados com mentores e históricos antigos de chat são purgados periodicamente pelo nosso cron job de retenção (`/api/cron/ai-retention`).
