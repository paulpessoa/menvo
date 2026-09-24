---
id: como-avaliar-a-mentoria
title: Como avaliar a mentoria após a sessão
audience: [mentee, admin]
tags: [avaliacao, feedback, estrelas, depoimento, mentor]
summary: Entenda como funciona a avaliação de 1 a 5 estrelas e depoimento sobre o mentor (modelo assimétrico exclusivo para mentorados).
status: current
last_reviewed: 2026-09-24
source_of_truth: [app/api/appointments/complete/route.ts, lib/services/assistant/tools.ts]
links:
  - label: Avaliar em Minhas Mentorias
    url: /mentee/my-mentorships
  - label: Avaliar no Chat do Copiloto
    url: /assistant
---

# Como Avaliar a Mentoria

Após a realização da sessão, o mentorado pode (e deve!) registrar sua avaliação sobre o encontro.

## Modelo Assimétrico da Menvo
Na Menvo, **apenas o mentorado avalia o mentor**. Isso existe porque os depoimentos e notas constroem a reputação pública do mentor voluntário na comunidade. Mentores não avaliam alunos/mentorados.

## Formas de Avaliar

1. **Pela Área do Mentorado:**
   - Acesse `/mentee/my-mentorships`.
   - Na mentoria concluída, clique em **"Avaliar Mentoria"**.
   - Atribua uma nota de 1 a 5 estrelas, escreva um feedback público para o perfil do mentor e adicione notas privadas se desejar.

2. **Diretamente no Chat do Copiloto:**
   - Ao abrir `/assistant`, caso você tenha uma sessão aguardando avaliação, o Copiloto informará no resumo e exibirá o chip **"⭐ Avaliar Mentoria no Chat"**.
   - Você pode simplesmente dizer: *"Quero avaliar minha mentoria com o [Nome do Mentor]"*. O Copiloto registrará a nota e o comentário instantaneamente através da ferramenta `evaluateMentorshipSession`.
