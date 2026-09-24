---
id: integracao-google-calendar
title: Integração com o Google Calendar
audience: [mentor, admin]
tags: [google-calendar, integracao, sincronizacao, conflitos, meet]
summary: Como conectar seu Google Agenda para bloquear horários conflitantes e criar links automáticos no Google Meet.
status: current
last_reviewed: 2026-09-24
source_of_truth: [docs/domains/scheduling.md]
links:
  - label: Conectar Google Calendar
    url: /mentor/availability
---

# Integração com o Google Calendar

Para evitar conflitos de agenda com sua rotina de trabalho pessoal, a Menvo permite sincronizar seu calendário Google diretamente:

## Benefícios da Conexão
1. **Detecção de Conflitos em Tempo Real:** Sempre que um mentorado for escolher um horário na sua agenda da Menvo, o sistema consulta a API `freebusy` do Google Calendar. Se você tiver uma reunião pessoal naquele horário, o slot é automaticamente ocultado da sua página pública.
2. **Criação Automática de Eventos:** Quando você confirma uma solicitação de mentoria, um evento é adicionado ao seu Google Agenda e ao do mentorado.
3. **Link do Google Meet Incluso:** O link seguro da videochamada é gerado e anexado diretamente ao evento da reunião.

## Como Conectar
1. Acesse o painel `/mentor/availability`.
2. Clique no botão **"Conectar Google Calendar"**.
3. Autorize o acesso de leitura de disponibilidade e gravação de eventos na conta Google desejada.
