---
id: integracao-google-calendar
title: Integração com o Google Calendar
audience: [mentor, admin]
tags: [google-calendar, integracao, sincronizacao, conflitos, meet, privacidade]
summary: Como conectar seu Google Agenda para a Menvo esconder horários em que você já está ocupado. É só consulta de ocupado/livre; só eventos marcados como "Ocupado" bloqueiam.
status: current
last_reviewed: 2026-10-02
source_of_truth: [docs/domains/scheduling.md]
links:
  - label: Conectar Google Calendar
    url: /mentor/availability
---

# Integração com o Google Calendar

A conexão serve para **evitar conflitos** entre a sua agenda da Menvo e os seus compromissos pessoais. Ela é **somente consulta**.

## O que a integração faz
- Quando um mentorado vai escolher um horário, a Menvo pergunta ao Google apenas se você está **ocupado ou livre** naquele intervalo. Se estiver ocupado, o horário some da sua página pública.
- Ela só **remove** opções. Nunca cria horários que você não cadastrou em `/mentor/availability`.

## O que a integração NÃO faz
- Não lê título, descrição, convidados ou local dos seus eventos.
- Não cria, altera nem apaga nada na sua agenda. A permissão pedida é só de leitura de disponibilidade.
- Não importa seus horários livres: seus horários de mentoria continuam sendo os que você cadastrou na Menvo.

## Regra importante: só eventos "Ocupado" bloqueiam
O Google só informa como ocupado o que está marcado como **"Ocupado"**. Eventos marcados como **"Livre"** não bloqueiam nenhum horário. Isso é comum em eventos de **dia inteiro** (feriados, "folga", lembretes), que o Google Agenda cria como "Livre" por padrão.

- Quer fechar um dia inteiro? Abra o evento no Google Agenda e mude de "Livre" para **"Ocupado"**.
- Um evento marcado como "Ocupado" no meio da noite bloqueia só aquele intervalo (a mentoria dura 45 minutos).

## Google Meet
O link do Google Meet é criado automaticamente quando você confirma uma solicitação de mentoria, e mentor e mentorado recebem o convite por e-mail. Isso funciona **com ou sem** a integração conectada.

## Como conectar
1. Acesse o painel `/mentor/availability`.
2. No card **"Sincronização Pessoal"**, clique em **"Conectar Google Calendar"**.
3. Autorize a leitura de disponibilidade na conta Google que tem a sua agenda pessoal.

Para parar, clique em **"Desconectar Agenda"** no mesmo card. Se não conectar, nada muda: sua agenda funciona normalmente, apenas sem esse filtro.

## Se a sincronização falhar
Se o Google estiver fora do ar ou a conexão expirar, a Menvo ignora o filtro e mostra todos os seus horários cadastrados, então **pode haver conflito**. Nesse caso, desconecte e conecte de novo.
