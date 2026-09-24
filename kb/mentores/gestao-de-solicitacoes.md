---
id: gestao-de-solicitacoes
title: Como gerenciar solicitações de mentoria
audience: [mentor, admin]
tags: [solicitacoes, aceitar, recusar, agendamentos, painel]
summary: Saiba como confirmar ou recusar pedidos de mentoria pendentes, prazos recomendados e avisos por e-mail.
status: current
last_reviewed: 2026-09-24
source_of_truth: [app/api/appointments/confirm/route.ts, lib/services/assistant/tools.ts]
links:
  - label: Solicitações de Mentoria
    url: /mentor/appointments
---

# Gestão de Solicitações de Mentoria

Quando um mentorado solicita um horário na sua agenda, você é notificado imediatamente por e-mail:

## Onde Responder
- **Painel do Mentor:** Acesse `/mentor/appointments` para ver todas as sessões pendentes, confirmadas e histórico.
- **Pelo E-mail:** O e-mail de notificação inclui botões com token seguro para confirmar com apenas um clique.
- **Pelo Copiloto:** No chat com o assistente, basta perguntar *"Tenho alguma solicitação pendente?"* para visualizar e gerenciar suas pendências via ferramenta `getMentorRequests`.

## Boas Práticas
- **Prazo de Resposta:** Procure confirmar ou recusar as solicitações em até 48 horas. Se imprevistos acontecerem, recuse com educação para que o mentorado possa buscar outro profissional sem ficar esperando.
- **Mensagem Personalizada:** Ao confirmar, você pode adicionar notas ou instruções breves para o mentorado chegar preparado.
