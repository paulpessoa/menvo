# E-mail 2: base Estágio Recife que nunca entrou (qui 08/10/2026)

Enviar entre 9h e 11h (America/Recife). É o segundo contato com quem recebeu o
convite `estagiorecife-2025` em 26/09 e não abriu.

## Por que esse e-mail

Em 06/10/2026: 717 contas, **612 nunca entraram**. Delas, 548 vêm da base
JotForm e já receberam o convite de 26/09, mas só **12 de 558** abriram a página
do convite (~2%), com 8 aceites, 1 mentor e 1 opt-out. O primeiro e-mail
explicava o que é a Menvo. Este traz um motivo concreto para entrar agora: o
mural, com prazo em 14/10. Também é mais curto.

## Como enviar (pelo admin, não pelo Brevo)

Essas pessoas **não têm senha**. Só o link com token do convite deixa a pessoa
criar a senha (`/convite/[token]` → `/update-password`). Por isso o envio sai
pelo modal de convites, não por uma lista importada no Brevo.

1. `/dashboard/admin/users` → **Convidar** (modal de campanha).
2. **Campanha:** `mural-estagiorecife-2026-10` (nome novo, então ninguém aparece
   como "já convidado").
3. **Público:** **"Receberam convite mas não abriram"**. Não use "Nunca entraram
   na plataforma": esse público inclui 62 contas que não vieram do JotForm, e o
   rodapé fixo diz "você preencheu o formulário do Estágio Recife", o que estaria
   errado para elas.
4. Conferir a contagem (~546). Opt-out, supressão LGPD e e-mail vazio já são
   removidos automaticamente.
5. Colar o assunto e o corpo abaixo, **enviar o teste para você**, abrir no
   celular e só então disparar.

Os botões e o rodapé são fixos no template (`buildReengagementInviteHtml`):
"Acessar a Menvo e completar meu perfil", "Quero apoiar como mentor(a)" e o link
para parar de receber e-mails ou apagar os dados. Não cole links no corpo.

---

**Assunto:** Seu perfil na Menvo já está quase pronto

---

Oi, {{primeiro_nome}}!

Há umas duas semanas te contei que o Estágio Recife ganhou uma extensão, a Menvo, uma plataforma gratuita de mentoria de carreira. Os dados que você mandou no formulário já estão lá esperando por você.

Agora tem uma novidade: os mentores voluntários conseguem ver quem está buscando ajuda, no Mural de Mentorados, e oferecer uma conversa. Você não precisa saber quem procurar. Basta dizer o que você busca.

Para aparecer no mural, são uns 5 minutos:

1. Clique no botão abaixo e crie sua senha (é o seu primeiro acesso).
2. Ative "Perfil público". Só mentores logados veem, e seu e-mail e telefone nunca aparecem.
3. Conte na bio o que você busca agora, escolha os tópicos e adicione seu LinkedIn.

A partir de 14/10, o mural mostra só perfis completos.

Já se formou e está trabalhando? Então talvez você seja quem pode ajudar. Depois de criar sua senha, entre no seu Perfil e clique em "Tornar-se Mentor". A gente valida rapidinho.

Qualquer dúvida, é só responder este e-mail. Sou eu mesmo que leio.

---

## Fora deste envio

- **Link "Quero apoiar como mentor(a)" não faz nada diferente.** Ele só grava
  `response = 'accepted_mentor'`. Depois disso a pessoa cai no mesmo
  `/update-password` → `/login` de quem é mentorado, sem passar pelo pedido de
  mentoria. A única pessoa que clicou nele (27/09) entrou e não virou mentora.
  Correção (código): levar um `next=/profile` seguro (allowlist) até depois do
  login, como já previa `docs/domains/reengagement-invites.md` §3.1. Até lá, o
  corpo do e-mail explica o caminho manual.

- **62 contas que não vieram do JotForm** e nunca entraram (11 sem e-mail
  confirmado). Precisam de outro texto de rodapé. Ficam para depois.
- **Medir na sex 09/10:** `select response, count(*) from reengagement_invites
  where campaign = 'mural-estagiorecife-2026-10' group by response;` e
  quantas aberturas (`opened_at`). Se ficar de novo perto de 2%, o problema é
  entrega (spam/promoções), não o texto. Nesse caso, olhar os logs
  transacionais do Brevo.
