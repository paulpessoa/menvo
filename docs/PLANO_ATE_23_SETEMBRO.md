# Plano de ação — 15 a 23 de setembro (UFPE no Mercado / Manguebit)

Objetivo do período: chegar ao evento com (1) o máximo possível dos mentores
da lista de espera com cadastro preenchido e aprovado, (2) mentores novos
captados, e (3) a plataforma mais divulgada. Ferramentas já prontas pra isso:
a aba **Waiting List** em `/dashboard/admin/users`, o fluxo **Torne-se um
Mentor** em `/profile` (com os 3 tutoriais), e `/dashboard/admin/verifications`
pra aprovar.

Marque cada item conforme for fazendo — isso não precisa ser feito na ordem
exata, mas a sequência abaixo evita gargalo (contatar antes de cobrar,
aprovar antes de divulgar).

---

## Terça, 15/09 (hoje)

- [ ] Abrir `/dashboard/admin/users` → aba **Waiting List** e conferir quantos
  registros existem e quantos já têm `has_profile` (já converteram conta)
- [ ] Nos que **ainda não têm conta**: clicar em "Criar Conta e Convidar"
  pra cada um (cria como mentee + manda e-mail com link direto pra definir
  senha)
- [ ] Nos que **já têm conta mas nunca preencheram nada de mentor**: usar o
  botão de WhatsApp (wa.me) que já vem preenchido com uma mensagem — mandar
  pessoalmente pra um primeiro grupo pequeno (5-10 pessoas) hoje, pra
  calibrar a mensagem antes de mandar pra todo mundo

## Quarta, 16/09

- [ ] Terminar de mandar WhatsApp/convite pro restante da lista de espera
- [ ] Responder quem já respondeu — tirar dúvidas, reforçar que é rápido
  (os 3 vídeos-tutorial cobrem perfil + agenda + como aceitar pedido)
- [ ] Gravar (ou pelo menos roteirizar de vez) o primeiro dos 3 vídeos
  tutoriais — "Como configurar seu perfil" (roteiro já pronto em
  `docs/TUTORIAL_SCRIPTS.md`) — é o que mais destrava gente parada no
  cadastro

## Quinta, 17/09

- [ ] Checar `/dashboard/admin/verifications` — aprovar quem já preencheu
  bio + abordagem + agenda corretamente; se faltar algo, usar o botão de
  WhatsApp pra pedir o complemento específico (mais rápido que e-mail)
- [ ] Postar no LinkedIn pessoal + Instagram da Menvo sobre a campanha de
  captação de mentores (pode reaproveitar o roteiro do vídeo 2 —
  "Divulgue que você é mentor" — como base do texto do post)
- [ ] Separar uma lista de 10-15 contatos pessoais (ex-colegas, pessoas do
  Porto Digital/UFPE) que fariam bons mentores e ainda não estão na
  plataforma — começar a chamar individualmente

## Sexta, 18/09

- [ ] Segunda rodada de contato com quem não respondeu ainda (WhatsApp é
  mais efetivo que e-mail pra essa cobrança)
- [ ] Gravar o vídeo 3 — "Sua primeira sessão de mentoria" (fecha o ciclo
  de onboarding pros que já viraram mentores essa semana)
- [ ] Preparar o material físico/digital pro evento: um cartão ou slide
  simples com QR code apontando pra `/mentors` (ou `/quiz`, se o foco for
  captar mentorados) e uma frase de efeito sobre a Menvo

## Sábado e Domingo, 19-20/09

- [ ] Dia mais livre — revisar o que ficou pendente da semana
- [ ] Se sobrar tempo: gravar o vídeo 2 (compartilhar no LinkedIn) e já
  divulgar você mesmo como exemplo, marcando a Menvo
- [ ] Testar o fluxo completo como se fosse um mentor novo (login → perfil →
  agenda → primeira notificação de pedido) pra pegar qualquer atrito de
  última hora antes do evento

## Segunda, 21/09

- [ ] Última cobrança pros que ainda não preencheram (framing: "essa semana
  fechamos a primeira turma verificada")
- [ ] Aprovar todos os pendentes que estiverem prontos em
  `/dashboard/admin/verifications`
- [ ] Conferir os números: quantos mentores verificados a mais essa semana
  vs. antes de começar (isso vira munição pra falar no evento)

## Terça, 22/09

- [ ] Revisão final: `/mentors` carregando bem, busca com IA funcionando,
  nenhum mentor com perfil incompleto aparecendo como "disponível"
- [ ] Preparar o pitch de 30 segundos da Menvo pro evento (o que é, pra quem
  é, como entrar — de cabeça, sem precisar abrir o site)
- [ ] Carregar celular/notebook, confirmar que tem internet garantida no
  local, e ter o link curto da plataforma fácil de passar (de viva voz ou
  por QR code)

## Quarta, 23/09 — UFPE no Mercado / Manguebit

- [ ] Levar o QR code / cartão preparado no dia 18
- [ ] Captar mentores e mentorados no local (se possível, já fazer a pessoa
  se cadastrar ali na hora, no celular)
- [ ] Anotar (no celular mesmo) nome + contato de quem demonstrar interesse
  mas não se cadastrar na hora, pra não perder o lead
- [ ] No fim do dia: dar uma olhada rápida em `/dashboard/admin/users` pra
  ver se algum cadastro novo do evento já apareceu

---

## Checklist de recursos que já existem (não precisa pedir de novo)

- **Aba Waiting List** (`/dashboard/admin/users` → Waiting List): botão
  "Criar Conta e Convidar" (ou "Enviar Convite" pra quem já tem conta),
  botão de WhatsApp com mensagem pré-pronta + copiar número, "Gerar Match"
  (sugestão de mentor por IA pra quem já preencheu motivação), "Pedir
  Perfil/Quiz" (e-mail pra quem não preencheu motivação)
- **Tutoriais de mentor** (`/profile`, aba "Torne-se um Mentor"): 3 cards —
  hoje abrem um mock ("vídeo em breve"); assim que gravar, me manda o link
  do YouTube que eu troco em 1 minuto
- **Verificação de mentor** (`/dashboard/admin/verifications`): aprova ou
  recusa quem pediu pra virar mentor — só depois disso o perfil aparece
  publicamente em `/mentors`
