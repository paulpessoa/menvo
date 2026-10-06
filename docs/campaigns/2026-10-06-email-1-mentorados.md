# E-mail 1: mentorados que já acessaram (ter 06/10/2026)

Origem: `docs/archive/COMMUNITY_CONTACT_PLAN.md` §6.1. Enviar entre 9h e 11h (America/Recife).

- **Remetente / responder para:** contato@menvo.com.br
- **Público:** mentorados que já fizeram login (não são mentores)
- **Nome:** no Brevo, use `{{ contact.FIRSTNAME }}`. Se enviar por outro lugar, troque pelo primeiro nome ou use "Oi!".

## Lista de destinatários

Em 05/10/2026: 104 contas já fizeram login → tira 12 mentores e 2 contas internas (@menvo.com.br) → **90 mentorados**. Nenhum opt-out ou supressão (LGPD) nesse grupo.

Rodar no Supabase (SQL Editor), baixar o resultado como CSV e importar no Brevo numa lista nova (Contatos → Importar), mapeando `email` → EMAIL e `firstname` → FIRSTNAME:

```sql
select lower(trim(p.email)) as email,
       initcap(split_part(trim(p.full_name), ' ', 1)) as firstname
from profiles p
join auth.users u on u.id = p.id
where u.last_sign_in_at is not null
  and not exists (select 1 from mentors_view m where m.id = p.id)
  and p.email is not null
  and p.email_opt_out_at is null
  and p.email not ilike '%@menvo.com.br'
  and not exists (
    select 1 from email_suppressions s
    where s.email_hash = encode(sha256(convert_to(lower(trim(p.email)), 'UTF8')), 'hex')
  )
order by p.email;
```

---

**Assunto:** Mentores agora podem encontrar você na Menvo

**Pré-cabeçalho:** Complete seu perfil em 5 minutos para aparecer no mural.

---

Oi, {{ contact.FIRSTNAME }}!

Temos uma novidade: mentores e mentoras voluntários da Menvo agora podem encontrar mentorados no **Mural de Mentorados** e oferecer ajuda por conta própria, sem esperar você agendar.

Para você aparecer lá, e para quem for te ajudar entender do que você precisa, seu perfil tem que estar completo. Leva uns 5 minutos:

1. **Ative "Perfil público"** (a partir de 18 anos). Só mentores logados veem, e seu e-mail e telefone nunca aparecem.
2. **Conte na bio o que você busca agora.** Exemplo: "Estou no 3º período de ADS e quero meu primeiro estágio em front-end. Preciso de ajuda com portfólio e entrevistas."
3. **Escolha os tópicos** em que quer mentoria e diga onde quer chegar.
4. **Adicione seu LinkedIn.** Hoje é por lá que os mentores entram em contato.
5. **Anexe seu currículo**, se tiver.

**[Completar meu perfil]** → https://www.menvo.com.br/profile

A partir de 14/10, o mural vai mostrar só perfis completos, e quem atualiza o perfil aparece primeiro.

Prefere não aparecer? É só deixar "Perfil público" desligado. Você continua podendo buscar e agendar mentores normalmente.

A Menvo é gratuita e feita por voluntários. Ficou com dúvida? É só responder este e-mail.

Um abraço,

*(assinatura pessoal do Paul, igual a `getPersonalSignatureHtml` em `lib/email/brevo.ts`, com o layout padrão dos e-mails: logo no topo, botão teal, rodapé LGPD + descadastro)*
