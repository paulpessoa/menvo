---
id: configurar-disponibilidade
title: Como configurar sua disponibilidade e horários
audience: [mentor, admin]
tags: [agenda, disponibilidade, horarios, slots, recorrencia]
summary: Como definir slots semanais recorrentes de atendimento e intervalos de mentoria no painel do mentor.
status: current
last_reviewed: 2026-09-24
source_of_truth: [docs/domains/scheduling.md, lib/services/appointments/availability.service.ts]
links:
  - label: Configurar Minha Disponibilidade
    url: /mentor/availability
---

# Configurando sua Disponibilidade na Menvo

A plataforma Menvo possui um motor de agendamento automático baseado em regras semanais recorrentes:

## Regras de Agendamento
- **Dias e Horários Recorrentes:** Você define os dias da semana (ex: terças e quintas) e as faixas de horário (ex: 19:00 às 21:00) em que tem disponibilidade para realizar mentorias voluntárias.
- **Intervalo Mínimo:** As sessões têm duração padrão de 45 a 60 minutos, com intervalos de respiro configuráveis entre cada encontro.
- **Janela Móvel de 14 Dias:** Seus horários são projetados automaticamente para os próximos 14 dias para evitar agendamentos muito distantes que aumentem o risco de faltas.
- **Bloqueio de Feriados ou Férias:** Você pode pausar temporariamente seus agendamentos no painel `/mentor/availability` alterando seu status para "Em pausa / Indisponível temporariamente".
