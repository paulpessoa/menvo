---
title: Scheduling and availability
owner: paul
status: current
last_reviewed: 2026-09-28
source_of_truth: [lib/services/appointments/availability.service.ts, app/api/appointments/availability/route.ts, app/api/mentors/availability/route.ts]
---

# Sistema de Agenda e Disponibilidade de Mentorias - Menvo

Este documento consolida as **regras de negócio, arquitetura e fluxo de dados** do sistema de agendamento e disponibilidade entre mentores e mentorados na Menvo.

---

## 🎯 Conceito Central: Template Semanal vs. Projeção no Calendário

O agendamento na Menvo opera sob dois conceitos fundamentais:

```
┌──────────────────────────────────────┐
│       TEMPLATE SEMANAL (Mentor)      │
│  "Atendo Segundas das 15h às 16h     │
│   e Quintas das 18h às 19h"          │
└──────────────────┬───────────────────┘
                   │ Projeção Dinâmica
                   ▼
┌──────────────────────────────────────┐
│     AGENDA DE 14 DIAS (Mentorado)    │
│  • Seg, 07/Set - 15:00 às 15:45      │
│  • Qui, 10/Set - 18:00 às 18:45      │
│  • Seg, 14/Set - 15:00 às 15:45      │
│  • Qui, 17/Set - 18:00 às 18:45      │
└──────────────────────────────────────┘
```

1. **Configuração Semanal do Mentor (`mentor_availability`)**:
   - O mentor **não** precisa cadastrar datas específicas todos os meses.
   - Ele configura um **padrão semanal recorrente** (ex: *Segunda-feira das 15:00 às 16:00*).
   - Isso garante previsibilidade e facilidade de manutenção para o mentor voluntário.

2. **Projeção Deslizante de 14 Dias (Visão do Mentorado)**:
   - Quando um mentorado acessa o perfil do mentor e clica em **"Agendar Mentoria"**, o sistema consulta a data atual e projeta todas as ocorrências daquele dia da semana nos **próximos 14 dias (2 semanas)**.
   - Por isso, uma regra de "Segunda-feira" se repete em 2 datas reais diferentes (a da semana atual e a da semana seguinte).

---

## 📋 Regras de Negócio Detalhadas

### 1. Duração Padrão das Mentorias
* **Duração Fixa:** Cada mentoria tem duração oficial de **45 minutos**.
* **Intervalo Mínimo:** Para que um horário fique disponível, a janela configurada pelo mentor deve ter **no mínimo 45 minutos**.
  - *Exemplo inválido:* 17:00 às 17:30 (30 min) ➔ **Não gera slots** e a tela do mentor exibe um aviso de validação impedindo o salvamento.
  - *Exemplo válido:* 17:00 às 17:45 (45 min) ➔ Gera 1 slot (17:00 - 17:45).
  - *Exemplo em bloco:* 15:00 às 17:00 (120 min) ➔ Gera 2 slots (15:00 - 15:45 e 16:00 - 16:45), deixando 15 minutos de respiro entre as sessões.

### 2. Bloqueios e Conflitos Dinâmicos
Um slot projetado só é exibido como disponível para o mentorado se passar por todos os filtros a seguir:

1. **Filtro de Passado:**
   - Horários cujo timestamp já tenha passado em relação ao horário atual são automaticamente descartados.
2. **Conflito com Sessões Menvo:**
   - Verifica na tabela `appointments` se já existe alguma mentoria com status `pending` ou `confirmed` que colida no intervalo de tempo, **por mentor**.
3. **Ciclo Virtuoso de Feedback (Avaliações Pendentes):**
   - Se o mentorado tiver alguma mentoria passada que ainda não foi avaliada, o sistema bloqueia novos agendamentos e solicita a avaliação da sessão anterior.

4. **Google Calendar do mentor (opcional, flag `google_calendar_sync_flag`):**
   - Se o mentor conectou a própria agenda em `/mentor/availability`, `computeAvailableSlots` consulta `calendar.freebusy.query` **só na agenda dele** (tokens em `google_calendar_tokens`, escopo `calendar.freebusy`) e esconde os slots que colidem.
   - **Só consulta, só remove:** nunca grava na agenda do mentor nem adiciona horários. Título e detalhes dos eventos não são lidos.
   - **Só eventos "Ocupado" bloqueiam.** Eventos marcados "Livre" (`transparency: transparent`, o padrão de eventos de dia inteiro) não aparecem no freebusy. Isso é do Google, não do código.
   - **Falha silenciosa por desenho:** sem conexão, token expirado ou erro do Google, o filtro é ignorado e todos os slots cadastrados aparecem (log `[AVAILABILITY] Google Calendar sync skipped`). `start_date` igual a `end_date` gera intervalo vazio e também cai nesse caso; a tela sempre manda 14 dias.
   - Verificado em produção em 2026-10-02: evento "Ocupado" às 20:30 escondeu o slot; evento de dia inteiro "Livre" não bloqueou.

> O filtro acima é **por mentor**, na agenda pessoal dele. Já o Google Meet de toda sessão é criado
> numa **única conta pessoal do Paul** (MVP deliberado, `GOOGLE_CALENDAR_*`),
> com mentor e mentorado como convidados - não é a agenda de ninguém mais.
> Um `getCalendarBusyIntervals` que consultava `calendar.freebusy.query` nessa
> mesma conta e aplicava o resultado a **todos os mentores** existiu até
> 2026-09-28: qualquer mentoria confirmada de qualquer mentor (ou um evento
> pessoal do Paul) bloqueava o mesmo horário para todo mundo. Removido nessa
> data - ver `docs/product/how-it-works.md`, C-T5.

### 3. Fuso Horário e Precisão
* Todo o banco de dados armazena os horários em **UTC**.
* As projeções utilizam o fuso horário de referência cadastrado no perfil do mentor (padrão: `America/Sao_Paulo` / GMT-3).
* Na API `/api/appointments/availability`, os horários são combinados com offset explícito de Brasília (`-03:00`) para conversão unificada em ISO strings.

---

## 🗄️ Estrutura de Dados no Supabase

### Tabela `mentor_availability`
Define a matriz semanal recorrente do mentor:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador único do slot |
| `mentor_id` | `uuid` | ID do perfil do mentor (`profiles.id`) |
| `day_of_week` | `smallint` | Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado) |
| `start_time` | `time` | Horário de início no formato `HH:MM:00` |
| `end_time` | `time` | Horário de término no formato `HH:MM:00` |
| `timezone` | `text` | Timezone de referência (ex: `America/Sao_Paulo`) |

### Tabela `appointments` (Sessões Agendadas)
Registra as mentorias efetivamente agendadas:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador único do agendamento |
| `mentor_id` | `uuid` | ID do mentor |
| `mentee_id` | `uuid` | ID do mentorado |
| `scheduled_at` | `timestamptz` | Data e hora de início em UTC |
| `duration_minutes` | `integer` | Duração em minutos (padrão: 45) |
| `status` | `text` | `pending`, `confirmed`, `completed`, `cancelled`, `rejected` |
| `pending_reminder_sent_at` | `timestamptz` | Data do lembrete único enviado ao mentor após 24h |
| `google_meet_link` | `text` | Link gerado automaticamente via Google Calendar |

---

### Ciclo de vida de um pedido pendente

Quando um mentorado faz um pedido, o \`status\` passa a ser \`pending\`.
- **Após 24 horas:** Se o horário agendado ainda não passou, o mentor recebe um único lembrete por e-mail e a coluna \`pending_reminder_sent_at\` é preenchida.
- **Após o horário da sessão passar:** Se o pedido continuar pendente, ele é cancelado automaticamente. O mentorado recebe um e-mail sugerindo procurar outro mentor. Como a verificação acontece via cron diário (10h UTC), a expiração pode ocorrer até ~24h depois do horário previsto.

---

## 🔄 Fluxo Completo de Agendamento

```mermaid
sequenceDiagram
    autonumber
    actor Mentor
    actor Mentee
    participant Front as Frontend (Web)
    participant API as /api/appointments/availability
    participant DB as Supabase (PostgreSQL)
    participant GCal as Google Calendar API

    Note over Mentor,DB: 1. Configuração Semanal
    Mentor->>Front: Define Seg (15h-16h) e Qui (18h-19h)
    Front->>DB: Salva em mentor_availability
    
    Note over Mentee,API: 2. Busca de Disponibilidade (14 dias)
    Mentee->>Front: Clica em "Agendar Mentoria" no perfil
    Front->>API: GET ?mentor_id=X&start_date=Hoje&end_date=Hoje+14d
    API->>DB: Busca regras semanais em mentor_availability
    API->>DB: Busca agendamentos existentes em appointments
    API->>API: Projeta blocos de 45min, remove conflitos e passados
    API-->>Front: Retorna lista de datas e horários disponíveis
    Front-->>Mentee: Exibe opções (ex: 7/Set, 10/Set, 14/Set, 17/Set)

    Note over Mentee,DB: 3. Confirmação do Agendamento
    Mentee->>Front: Seleciona dia/horário e informa tópicos de dúvida
    Front->>DB: Cria registro em appointments (status: pending)
    Front->>GCal: Cria evento no Google Calendar com link Meet
    Front-->>Mentee: Agendamento solicitado com sucesso!
```

---

## 🛡️ Tratamento de Erros e Casos de Borda

1. **Tentativa de salvar slot < 45 min:**
   - Validado no frontend antes do envio: *"O intervalo em {dia} deve ser de no mínimo 45 minutos (tempo de uma sessão)"*.
2. **Sobreposição de horários no mesmo dia:**
   - Validado no frontend antes do envio: *"Horários sobrepostos em {dia}"*.
3. **Mentor sem disponibilidade:**
   - Modal exibe mensagem explicativa de que o mentor não possui horários abertos e sugere retornar mais tarde.
4. **Mentee com avaliação pendente:**
   - O modal bloqueia a seleção de slots e exibe um botão direto para concluir a avaliação pendente da sessão anterior.
