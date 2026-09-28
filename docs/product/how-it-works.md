---
title: Página /how-it-works — alinhamento e evolução da jornada por perfil
owner: paul
status: planned
last_reviewed: 2026-09-28
source_of_truth: [app/[locale]/how-it-works/page.tsx, app/[locale]/how-it-works/layout.tsx, messages/pt-BR.json, messages/en.json, messages/es.json]
---

# /how-it-works — plano de ajuste

> Auditoria de 2026-09-28: a página promete coisas que não existem (videochamada
> de verificação, duração configurável, ESG, relatórios, matching por ONG) e
> esconde o que já existe (diagnóstico com IA, compartilhamento com mentor,
> Google Meet/Calendar, confirmação pelo mentor). Este doc é o plano de
> execução; as Partes A–B são só texto/UI, a Parte C são features novas.

## Decisões (Paul, 2026-09-28)

1. **Só mostrar o que existe.** Nada de "em breve" na página pública — parceiros
   comparam com o painel real.
2. **Sem recrutadores na plataforma.** Se vier, é externo ou bem depois. Remover
   a FAQ `faq.q9` e a menção a recrutadores na metadata de `/faq`.
3. **ONGs e empresas viram uma aba só: "Para organizações".** A plataforma já
   trata as duas pelo mesmo modelo (`organizations.type`). A página fica com
   **3 abas**: Mentorados · Mentores · Organizações.
4. **Fluxo simples por perfil:** cada perfil tem uma única "próxima ação" em
   cada momento. Feature nova só entra se reduzir passos ou dúvidas, nunca se
   adicionar uma tela paralela.

---

## Parte A — Corrigir e alinhar a página (Sonnet)

Todos os textos em `messages/{pt-BR,en,es}.json`, chave `howItWorks`.

### A1. Aba Mentorados (5 passos)
| # | Título | Itens |
|---|---|---|
| 1 | Crie seu perfil | currículo · foto · entrar com Google/LinkedIn |
| 2 | **Faça seu diagnóstico de carreira (novo)** — ícone `Sparkles`, link `/quiz` | conversa guiada com IA · sugestão de mentores para o seu momento · compartilhe o resultado com seu mentor, se quiser |
| 3 | Encontre o mentor ideal | temas e especialidades · idioma e localização · filtros de inclusão · avaliações de outros mentorados |
| 4 | Peça uma sessão | agenda dos próximos 14 dias · sessões de 45 min · conte o que quer conversar · **o mentor confirma o pedido** |
| 5 | Converse e avalie | link do Google Meet automático · lembrete por e-mail no dia · **avalie a sessão** (a avaliação libera o próximo agendamento) |

### A2. Aba Mentores (4 passos)
| # | Título | Itens |
|---|---|---|
| 1 | Crie seu perfil e peça para ser mentor | sua conta começa como mentorado · conte sua experiência e temas · solicite em `/profile` |
| 2 | Revisão pela equipe | ~~videochamada~~ → nossa equipe revisa seu perfil · você recebe a resposta por e-mail e no chat · aprovado, seu perfil fica público com selo de verificado |
| 3 | Defina sua disponibilidade | horários semanais recorrentes · sessões fixas de 45 min com 15 min de respiro · conecte o Google Calendar para bloquear horários ocupados |
| 4 | Realize mentorias | confirme ou recuse pedidos · veja o diagnóstico que o mentorado compartilhou · acompanhe sessões, horas e avaliações |

CTA mantém `/profile?tab=mentorship` (logado) ou `/signup`.

### A3. Aba Organizações (nova, substitui ONGs + Empresas)
Público: ONGs, institutos, escolas, empresas com voluntariado, eventos.

| # | Título | Itens |
|---|---|---|
| 1 | Crie a página da sua organização | fale com a equipe Menvo · sua página em `menvo.com.br/o/sua-org` · aberta a pedidos ou só por convite |
| 2 | Traga sua comunidade | convide beneficiários por e-mail · convide colaboradores/voluntários como mentores · aprove quem pedir para participar |
| 3 | Conecte com mentores | beneficiários usam o mesmo catálogo e diagnóstico · mentores da organização atendem pela plataforma · tudo gratuito |
| 4 | Acompanhe o impacto | painel com beneficiários e mentores · quem fez o diagnóstico · sessões agendadas e realizadas |

CTA: "Falar com nossa equipe" → `/contact` (ver C-O1).
Imagens: usar `ngo-register.jpg`, `company-volunteer.jpg`, `ngo-connect.jpg`, `grow.jpg` (hoje `find.jpg` repete).

### A4. Remoções / limpeza
- Remover `howItWorks.ngos` e `howItWorks.companies` → nova chave `howItWorks.organizations`; `forNGOs`/`forCompanies` → `forOrganizations`.
- `?tab=ngos` e `?tab=companies` continuam funcionando como **alias** para `organizations` (links antigos, `components/footer.tsx:149,157`). Footer passa a ter um só link `?tab=organizations`.
- `howItWorks.faq.q1..q6`, `stillHaveQuestions`, `supportDescription`, `contactSupport`: **não são usadas** por nenhum componente (só `title/description/viewAll`) — apagar.
- FAQ (`faq.*`, página `app/[locale]/faq/page.tsx` itera `[1..10]`):
  - q5 → "Após pedir para ser mentor no seu perfil, nossa equipe revisa suas informações e responde por e-mail. Aprovado, seu perfil fica público."
  - q7 + q8 → uma pergunta só: "Como organizações participam?" (texto da A3, sem ESG).
  - q9 (recrutadores) → remover.
  - Renumerar e ajustar o array para o total real (8 perguntas).
  - `app/[locale]/faq/metadata.ts`: tirar "empresas e recrutadores" da description.
- `lib/types/models/user.ts:7` `UserType` inclui `"recruiter"`/`"company"` — verificar se é usado; se não, remover (fora do escopo visual, pode ficar para depois).

### A5. Técnico
- `layout.tsx`: description vem do i18n (`howItWorks.metaDescription`), citando mentorados, mentores e organizações.
- Tokens de tema: `text-gray-900` → `text-foreground`, `bg-white` → `bg-card`, `text-gray-700` → `text-foreground/80`, `ring-white` → `ring-background`, `border-gray-50` → `border-border`.
- `alt` das imagens traduzido (usar o título do passo).
- Extrair `StepSection({ section, steps, images, icons, rotate })` — as 3 abas usam o mesmo componente; número de passos variável por aba (5/4/4).
- Tab padrão por papel quando logado e sem `?tab`: mentor → `mentors`, admin de org → `organizations`, senão `mentees`.

### A6. Verificação
`npx tsc --noEmit`, `npm test`, e a página renderizada nas 3 abas × 3 idiomas × claro/escuro; `?tab=ngos` e `?tab=companies` caem em Organizações; `/faq` mostra 8 perguntas sem buracos.

---

## Parte B — Garantir que o prometido é verdade

Antes de publicar a Parte A, conferir no app (preview):
- Lembrete no dia (`/api/cron/appointments`, 10h UTC) chega para os dois lados.
- E-mail de aprovação de mentor é enviado (`processVerification`).
- O pedido de sessão aparece para o mentor e ele consegue confirmar/recusar.

---

## Parte C — O que criar para completar a jornada (mantendo simples)

Priorizado. **P1** = fecha um buraco real da jornada atual; **P2** = melhora
clara com custo baixo; **P3** = só quando houver demanda.

### Mentorados
| ID | O quê | Por quê | Prio | Modelo |
|---|---|---|---|---|
| C-M1 | **Card "Seu próximo passo"** no `/dashboard/mentee`: uma única ação derivada do estado (completar perfil → fazer diagnóstico → pedir sessão → aguardando confirmação → avaliar sessão). Reusar o cálculo de estado do briefing (`lib/ai-menvo/copilot/briefing.ts`) em vez de duplicar. Substitui os CTAs soltos (`MenteeQuizCTA`, banner de avaliação). | Hoje o dashboard tem vários CTAs competindo; a jornada é linear e deve parecer linear. | P1 | Sonnet |
| C-M2 | **"Agendar de novo"** com o mesmo mentor, logo após avaliar (link para `/appointments/book/[mentorId]`). | Continuidade é o que gera resultado em mentoria; hoje o mentorado precisa buscar o mentor de novo. | P1 | Sonnet |
| C-M3 | **"Me avise quando abrir horário"** quando o mentor não tem disponibilidade: grava interesse e envia e-mail quando o mentor salvar novos horários. | Hoje o modal só diz "volte mais tarde" — é onde o mentorado se perde. | P2 | Opus (tabela + RLS), Sonnet (UI) |

### Mentores
| ID | O quê | Por quê | Prio | Modelo |
|---|---|---|---|---|
| C-T1 | **Checklist de ativação pós-aprovação** no `/dashboard/mentor`: disponibilidade configurada · Google Calendar conectado · perfil público com temas preenchidos. Some quando completo. | Mentor aprovado sem disponibilidade ou sem `expertise_areas` não aparece/não é agendável e não sabe por quê (ver `mentor-verification.md`, regra do `/mentors`). | P1 | Sonnet |
| C-T2 | **Pedido pendente não fica eternamente pendente:** lembrete ao mentor 24h após o pedido e expiração automática (`status → cancelled`, com e-mail ao mentorado sugerindo outros mentores) quando o horário passa sem confirmação. Estender o cron de `appointments`. | Hoje não há nada que trate `pending` — o mentorado espera sem resposta, pior ponto da jornada. | P1 | Opus (regra/cron), Sonnet (e-mails) |
| C-T3 | **Certificado de horas voluntárias** (página imprimível/PDF em `/profile` ou dashboard): nome, período, nº de sessões e horas concluídas, nota média, link de verificação. | Reconhecimento concreto para o voluntário; também é o que empresas/ONGs pedem para comprovar voluntariado — substitui com honestidade as promessas de "ESG" e "controle de horas". | P2 | Sonnet (Opus revisa o link de verificação público) |
| C-T4 | **"Pausar mentorias"** explícito: confirmar se o toggle de `is_public` em `ProfileAboutSection` já cobre; se sim, só dar nome e lugar claros (dashboard do mentor). | Voluntário que some por um mês não deve precisar apagar a disponibilidade. | P3 | Sonnet |

### Organizações
| ID | O quê | Por quê | Prio | Modelo |
|---|---|---|---|---|
| C-O1 | **Formulário "Quero a Menvo na minha organização"** em `/contact?tipo=organizacao` (nome, tipo, contato, nº aproximado de pessoas) no lugar do `mailto`, gravando para o admin da plataforma. | CTA da aba Organizações cai hoje num e-mail solto; o admin não tem fila. Continua sem autocadastro (decisão do doc de organizações). | P1 | Sonnet (Opus revisa a rota pública/rate limit) |
| C-O2 | **Corrigir perda do `next` no onboarding:** conta nova que vem de `/o/[slug]` passa por `/onboarding` e não volta para a página da organização. | Gap conhecido (`organizations.md` §5 e §6.7) que quebra exatamente o fluxo que a aba passa a vender. | P1 | Sonnet |
| C-O3 | **Relatório de impacto simples** no `/dashboard/org`: filtro de período + horas de mentoria, sessões realizadas, diagnósticos feitos, nota média — e **exportar CSV** do mesmo recorte. | É o que a organização precisa mostrar a financiadores; hoje só há contadores totais. Sem certificação ESG, sem selo. | P2 | Opus (escopo de dados/LGPD do CSV), Sonnet (UI) |
| C-O4 | Chip "Mentor da {org}" no card público (só orgs `open`). | Já anotado como follow-up em `organizations.md` §6.7. | P3 | Sonnet |

### Explicitamente fora
Recrutadores/acesso a talentos · certificados ESG e "Selo de Empresa Amiga" ·
controle de horas corporativo · matching feito pela organização · mentor
avaliando mentorado (contraria o invariante de avaliação assimétrica) ·
cobrança/cotas para organizações.

---

## Ordem de execução

1. **Parte A + B** (um PR, Sonnet).
2. **C-M1, C-M2, C-T1, C-O2** (Sonnet — só UI/fluxo, sem schema).
3. **C-T2, C-O1** (spec e revisão Opus → implementação Sonnet).
4. **P2** conforme prioridade do Paul: C-O3, C-T3, C-M3.

Quando uma feature da Parte C for entregue, adicionar o item correspondente na
aba certa de `/how-it-works` no mesmo PR — a página nunca deve prometer antes
nem ficar atrás do produto.
