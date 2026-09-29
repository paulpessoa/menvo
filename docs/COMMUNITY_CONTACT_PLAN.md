# Plano - Mural de Mentorados: contato mentor → mentorado, e-mails e onboarding

> **Status:** proposta, 2026-09-29. **Já feito nesta data** (ver §1). O resto
> está dividido em fases com data (§9). Itens de SQL/RLS são de Opus; UI, i18n
> e templates são de Sonnet (ver memória "model-switch-handoff").

---

## 1. O que já foi corrigido (2026-09-29)

| Mudança | Arquivo | Por quê |
|---|---|---|
| A rota do mural passa o cliente Supabase **do servidor** ao serviço | `app/api/community/route.ts`, `lib/services/community/community.service.ts` | O serviço usava `createBrowserClient` no servidor, sem sessão. Com a policy `Public profiles visibility restricted` (`20260928000004`), `auth.uid()` era nulo e o mural voltava **vazio** para todo mentor. |
| Busca sanitizada e `limit` limitado a 48 | idem | O termo de busca era interpolado no filtro `or()` do PostgREST (vírgula/parêntese quebravam ou injetavam filtros). |
| Ordenação por `updated_at` | idem | Quem atualiza o perfil sobe no mural: é o incentivo do e-mail aos mentorados. |
| Card mostra `mentorship_topics` (o que o mentorado quer aprender) | `components/MenteeCard.tsx` | Mostrava `expertise_areas`, campo de mentor. |
| Página do mentorado seleciona colunas explícitas | `app/[locale]/mentee/[slug]/page.tsx` | `select('*')` serializava `email`, `phone`, `age`, `address` e `original_data` (respostas do Estágio Recife) no payload do navegador do mentor. |
| "Onde quero chegar" lê `learning_goals` | `MenteeProfileClient.tsx` | Lia `career_goals`, coluna que não existe; o campo que o mentorado preenche nunca aparecia. |
| Página do mentorado com `noindex` | `page.tsx` | Dado de mentorado não deve ir para buscadores. |
| Com o chat desligado, "Oferecer ajuda" abre o perfil completo | `app/[locale]/community/page.tsx` | O mentor lê o contexto antes de abordar; o LinkedIn fica no perfil. |
| Textos da página do mural via i18n; dica "3x mais visibilidade" removida | idem + `messages/*` | O número não tinha base. |
| Microfone (`TextareaWithVoice`) em "Como você conduz suas mentorias?" e "O que o mentorado deve preparar?" | `components/profile/ProfileMentorshipSection.tsx` | Pedido do fundador. |
| `VoiceInput` e `TextareaWithVoice` corrigidos | `components/ui/voice-input.tsx`, `textarea-with-voice.tsx` | A fala **substituía** o texto do campo (perderia a abordagem já escrita do mentor); os handlers liam `transcript`/`isListening` congelados do 1º render, então o auto-stop por silêncio nunca disparava; o idioma era fixo em pt-BR. Também afeta o quiz, para melhor. |
| Termos: participação voluntária e sem vínculo, contato entre usuários, código aberto, contribuições; Privacidade: quem vê o perfil do mentorado | `messages/{pt-BR,en,es}.json`, `app/[locale]/terms/page.tsx` | §7. |
| Link "Código aberto" no rodapé e seção de contribuição de textos no CONTRIBUTING | `components/footer.tsx`, `CONTRIBUTING.md` | §8. |
| Toggle "Perfil público" explica quem vê e que e-mail/telefone não aparecem | `components/profile/ProfileAboutSection.tsx` | Consentimento informado. |

---

## 2. P0 - vazamento de colunas em `profiles` (fazer antes dos e-mails)

**Problema.** A RLS de `profiles` filtra **linhas**, não **colunas**, e não há
`GRANT`/`REVOKE` por coluna em nenhuma migração. Consequências hoje:

- **Qualquer pessoa**, com a anon key (que é pública no bundle JS), pode
  chamar `GET /rest/v1/profiles?select=email,phone,original_data` e receber
  esses campos de **todos os mentores** com `is_public = true`.
- **Qualquer mentor** logado pode fazer o mesmo com **todos os mentorados**
  públicos.

A Privacidade agora diz que e-mail e telefone "nunca são exibidos para outros
usuários". Na interface isso é verdade; na API, não. Os e-mails do §6 vão
levar mentores ao mural, então isso precisa estar fechado antes.

**Diagnóstico rodado (2026-09-29, bloco 6):** `anon` lia **578 linhas, 578
e-mails, 6 telefones e 564 `original_data`**, ou seja, a base inteira. A
`mentors_view` também expõe `email`, `phone`, `address` e `external_id` dos
mentores. Correção de emergência:
`supabase/migrations/20260929150000_profiles_emergency_exposure_fix.sql`,
só com policies *restrictive* de **linhas** (valem por cima de qualquer policy
antiga): anon passa a ver só mentores públicos. A 1ª versão também limitava
colunas, mas a trava abortou porque **`mentors_view` é `security_invoker`**:
o Postgres checa as colunas de `profiles` usadas pela view (inclusive `email`)
com o papel de quem consulta, então revogar colunas de anon quebraria
`/mentors`. `mentor-public.service.ts` deixou de fazer `select("*")`.

**Ainda aberto (etapa A2):** e-mail/telefone/endereço de **mentores públicos**
continuam legíveis por anon, via `profiles` e via `mentors_view`. Correção:
recriar `mentors_view` sem `email`, `phone`, `address`, `external_id` e
`origin_platform` (precisa do `pg_get_viewdef` do bloco 4), passar o
`admin.service.ts` (que lê `mentors_view` com `*` e mostra `mentor.email`) a
buscar o e-mail em `profiles`, e só então revogar essas colunas de anon em
`profiles`. Usuário logado: etapa B, a seguir.

**Incidente (LGPD, art. 48):** não sabemos se alguém extraiu os dados. Olhar
nos logs da API do Supabase (Logs Explorer → API/edge) por requisições a
`/rest/v1/profiles` com a anon key pedindo `email`/`original_data` ou muitas
linhas. Se houver sinal de extração em massa, a Resolução CD/ANPD nº 15/2024
pede comunicação à ANPD e aos titulares (prazo de 3 dias úteis a partir do
conhecimento). Confirmar com o advogado.

**Estado anterior (2026-09-29):** o schema real de `profiles` (policies antigas,
`mentors_view`, grants) só existe no banco; as migrações `*_remote_baseline`
são marcadores vazios. Antes de escrever a correção, rodar
`supabase/diagnostics/20260929_profiles_exposure.sql` no SQL Editor e colar o
resultado. O bloco 6 prova (ou não) a exposição para anon.

Achados do código que a correção precisa respeitar:

- Ler o **próprio** perfil com `select('*')` pelo cliente do usuário:
  `lib/auth/server-utils.ts`, `app/auth/callback/route.ts`,
  `app/api/auth/me/route.ts`, `app/api/profile/route.ts`,
  `app/api/profile/update/route.ts`. Por isso **não dá para revogar colunas de
  `authenticated`** sem antes trocar essas leituras por colunas explícitas.
- Ler o perfil **de outra pessoa** pelo cliente do usuário: embeds
  `profiles!mentor_id/mentee_id` em `lib/services/mentorship/mentorship.service.ts`
  (inclui `email`), `lib/services/notifications/notifications.service.ts`,
  `lib/services/assistant/tools.ts`; `diagnostic-shares.service.ts` (recebe o
  client por parâmetro); `chat.service.ts` (chat desligado). O painel do mentor
  (`app/api/dashboard/mentor`) usa service role e não é afetado.

**Correção proposta (Opus), em duas etapas:**

- **Etapa A, `anon` (baixo risco):** `revoke select on profiles from anon` +
  `grant select (<colunas públicas de mentor>) on profiles to anon`. Anônimo
  não tem "próprio perfil", então nada de dono quebra. Checar antes se
  `mentors_view` é `security_invoker` (bloco 4): se for, precisa das mesmas colunas.
- **Etapa B, `authenticated`:** os passos abaixo, com uma cláusula nova
  "participantes de um agendamento (`appointments`) ou de um
  `diagnostic_shares` veem a linha um do outro", para os embeds acima
  continuarem funcionando.

Passos da etapa B:

1. Criar `public.community_mentees(search text, page int, page_size int)`,
   uma RPC `security definer` que confere se o chamador é mentor/admin e
   devolve **só** as colunas seguras (as de `COMMUNITY_COLUMNS` +
   `MENTEE_PUBLIC_COLUMNS`), já com o filtro `community_ready` (§5) e a
   exclusão de mentores. Isso também tira a busca de `mentors_view` + `not in
   (...)` gigante do serviço.
2. Criar `public.mentee_profile_by_slug(slug text)`, mesma ideia, para
   `/mentee/[slug]`.
3. Trocar a policy de `profiles` por: dono vê a própria linha; o resto só via
   `mentors_view`/RPCs. Antes, rodar `grep -rn "from(\"profiles\")"` e listar
   todo lugar que lê perfil **de outra pessoa**; cada um vira view/RPC com
   colunas explícitas.
4. Mentores: conferir o que `mentors_view` expõe e se algum client lê
   `profiles` de mentor diretamente.
5. Teste de RLS: anon e mentor tentando `select=email,phone,original_data`
   devem receber vazio/erro.

---

## 3. Como um mentor fala com um mentorado (hoje e proposto)

**Hoje (chat desligado):**

```
Mentor logado → /community (só mentor/admin)
  → card do mentorado → "Oferecer ajuda" ou "Ver perfil"
  → /mentee/[slug]: bio, objetivos, tópicos, currículo, links
  → "Conversar no LinkedIn" (se o mentorado cadastrou LinkedIn)
  → conversa no LinkedIn → mentor convida a agendar pelo perfil dele na Menvo
```

Limites: mentorado **sem LinkedIn não é contatável**; a Menvo não vê se houve
contato (sem métrica); o mentor não recebe um roteiro de abordagem.

**Proposto, fase 2: "Oferecer ajuda" por e-mail intermediado.**

1. No perfil do mentorado, o botão abre um modal com uma mensagem curta (com
   microfone) já preenchida por um modelo (§6.3).
2. `POST /api/community/outreach` → a Menvo envia um e-mail ao mentorado via
   Brevo com a mensagem, o link do perfil do mentor e **`reply-to` = e-mail do
   mentor**. O e-mail do mentorado continua oculto; o mentor expõe o dele ao
   enviar (consentimento explícito no modal).
3. Tabela `mentor_outreach (mentor_id, mentee_id, created_at)`: limite de 5
   envios/dia por mentor, 1 por par a cada 30 dias, e visão no admin para
   abuso. Respeita `email_opt_out_at` e `email_suppressions`.
4. Mentorado responde por e-mail ou agenda direto no perfil do mentor.

Funciona para quem não tem LinkedIn, gera métrica ("contatos ofertados",
"agendamentos após contato") e não exige chat.

---

## 4. Chat: manter a flag desligada

**Recomendação: deixar `chat_flag` desligada** e fazer o e-mail intermediado
(§3). Motivos:

- **Mensagem sem notificação morre.** A maioria dos mentorados entrou uma vez.
  Um chat só funciona com e-mail/push de "você tem mensagem nova", digest,
  controle de frequência e opt-out. É um produto inteiro.
- **Moderação e segurança.** Chat pede bloquear, denunciar, retenção das
  mensagens (LGPD), e há risco de o público incluir **menores de idade**
  (o quiz tem "ensino médio"; ver §7.3).
- **O e-mail já é onde as pessoas estão.** O e-mail intermediado entrega o
  mesmo "primeiro contato" com uma fração do código e sem expor dados.
- **WhatsApp/telefone visível: não recomendo.** Telefone exposto a centenas de
  mentores é vetor de assédio e spam, e não dá para revogar depois que foi
  copiado. Se a conversa evoluir, o próprio mentorado passa o número.

**Quando reavaliar:** se, depois de 4-6 semanas, houver mais de ~30
contatos/semana e mentorados respondendo, o chat passa a valer o custo.

---

## 5. Só perfis completos no mural

**Critério `community_ready`** (coluna gerada, Opus):

```sql
alter table public.profiles add column community_ready boolean
  generated always as (
    coalesce(is_public, false)
    and char_length(coalesce(bio, '')) >= 80
    and (
      coalesce(array_length(mentorship_topics, 1), 0) > 0
      or char_length(coalesce(learning_goals, '')) >= 40
    )
    and linkedin_url is not null and linkedin_url <> ''
  ) stored;
create index profiles_community_ready_idx on public.profiles (updated_at desc)
  where community_ready;
```

- **LinkedIn é obrigatório enquanto for o único canal de contato.** Quando o
  e-mail intermediado (§3) existir, tirar essa exigência.
- Foto não entra no critério: só dá prioridade na ordenação, para não excluir
  quem não quer foto.
- **Ligar o filtro só depois do e-mail aos mentorados** (§9), senão perfis
  somem sem aviso.
- No `/profile` do mentorado: barra "Seu perfil está X% pronto para o mural"
  listando o que falta (Sonnet).

---

## 6. E-mails

Usar a infra de campanhas que já existe (`/api/admin/invites`,
`resolveAudience`, supressão e opt-out). Falta:

- Duas audiências novas em `InviteAudience`: `mentees_signed_in` (tem
  `last_sign_in_at`, **não** está em `mentors_view`) e `mentors_active`
  (está em `mentors_view`). `fetchSignedInUserIds()` já existe.
- Dois templates (`lib/email/`), com campanha própria cada um para
  `reengagement_invites` não reenviar.

### 6.1 Mentorados que já acessaram

**Assunto:** Mentores agora podem encontrar você na Menvo
**Pré-cabeçalho:** Complete seu perfil em 5 minutos para aparecer no mural.

> Oi, {{primeiro_nome}}!
>
> Temos uma novidade: mentores e mentoras voluntários da Menvo agora podem
> encontrar mentorados no **Mural de Mentorados** e oferecer ajuda por conta
> própria, sem esperar você agendar.
>
> Para você aparecer lá, e para quem for te ajudar entender do que você
> precisa, seu perfil tem que estar completo. Leva uns 5 minutos:
>
> 1. **Ative "Perfil público"** (a partir de 18 anos). Só mentores logados
>    veem, e seu e-mail e telefone nunca aparecem.
> 2. **Conte na bio o que você busca agora.** Exemplo: "Estou no 3º período de
>    ADS e quero meu primeiro estágio em front-end. Preciso de ajuda com
>    portfólio e entrevistas."
> 3. **Escolha os tópicos** em que quer mentoria e diga onde quer chegar.
> 4. **Adicione seu LinkedIn.** Hoje é por lá que os mentores entram em
>    contato.
> 5. **Anexe seu currículo**, se tiver.
>
> **[Completar meu perfil]** → https://www.menvo.com.br/profile
>
> A partir de {{data_filtro}}, o mural vai mostrar só perfis completos, e quem
> atualiza o perfil aparece primeiro.
>
> Prefere não aparecer? É só deixar "Perfil público" desligado. Você continua
> podendo buscar e agendar mentores normalmente.
>
> A Menvo é gratuita e feita por voluntários. Ficou com dúvida? É só responder
> este e-mail.
>
> Abraço,
> Paul, da Menvo

### 6.2 Mentores

**Assunto:** Novo na Menvo: veja quem está procurando mentoria
**Pré-cabeçalho:** {{N}} mentorados já contaram do que precisam.

> Oi, {{primeiro_nome}}!
>
> Obrigado por ser mentor(a) na Menvo. Temos uma novidade: o **Mural de
> Mentorados**.
>
> Até agora, você esperava alguém te encontrar e agendar. Agora dá para fazer o
> caminho contrário: ver quem está buscando ajuda e o que cada pessoa precisa,
> e oferecer uma conversa.
>
> **Como funciona**
>
> 1. Abra o Mural de Mentorados. Só mentores têm acesso.
> 2. Escolha alguém cujo objetivo combine com sua experiência e leia o perfil:
>    bio, objetivos, tópicos e currículo.
> 3. Chame a pessoa no LinkedIn. Diga quem você é, que a encontrou pela Menvo e
>    em que pode ajudar.
> 4. Se fizer sentido, convide a pessoa a agendar um horário com você pela
>    Menvo. Assim a sessão fica registrada e ela pode te avaliar.
>
> **[Ver o Mural de Mentorados]** → https://www.menvo.com.br/community
>
> **Um modelo para a primeira mensagem:**
> "Oi, {nome}! Sou {seu nome}, {cargo} na {empresa}, e sou mentor(a)
> voluntário(a) na Menvo. Vi no seu perfil que você está buscando {objetivo}.
> Tenho experiência com isso e posso ajudar numa conversa de 30 minutos. Se
> topar, é só agendar um horário comigo aqui: {link do seu perfil na Menvo}."
>
> Uma regra importante: o mural é só para mentoria voluntária. Nada de
> recrutamento nem venda de cursos, produtos ou serviços.
>
> Obrigado por doar seu tempo.
> Paul, da Menvo

### 6.3 Por que essa ordem

Os mentorados recebem primeiro para que, quando os mentores chegarem, o mural
já tenha perfis bons. Mentor que chega num mural vazio ou fraco não volta.

---

## 7. Termos e Privacidade

### 7.1 O que entrou (2026-09-29, pt/en/es)

- **Participação voluntária e sem vínculo:** gratuita, encerrável a qualquer
  momento, sem vínculo empregatício/societário/de prestação de serviço;
  cita a **Lei 9.608/1998, art. 1º, parágrafo único** (serviço voluntário
  não gera vínculo nem obrigação trabalhista/previdenciária); o aceite dos
  Termos vale como **termo de adesão** (art. 2º da mesma lei); e o **art. 392
  do Código Civil** (em contrato benéfico, quem não se beneficia só responde
  por dolo), que protege o mentor e a Menvo.
- **Contato entre mentores e mentorados:** só pelos canais que o mentorado
  deixou visíveis; proibido recrutamento, venda e spam; conversas fora da
  plataforma são responsabilidade dos envolvidos; responsabilidade por
  conteúdo de usuário segue o **Marco Civil da Internet, art. 19**.
- **Código aberto (MIT)**, com a marca "Menvo" fora da licença. Antes o texto
  dizia que o código-fonte era "propriedade exclusiva", o que contradizia o
  `LICENSE`.
- Mentoria **não substitui** aconselhamento jurídico, psicológico, financeiro
  ou médico.
- Privacidade: quem vê o perfil do mentorado e o que nunca é mostrado.

### 7.2 Pendências para dar força jurídica real

1. **Registrar o aceite:** hoje o cadastro não grava que a pessoa aceitou os
   Termos. Sem isso, o "termo de adesão" é fraco. **Feito no banco
   (2026-09-29):** migração `20260929150002_terms_acceptances.sql` (tabela
   só de inserção, com `accepted_at` sempre vindo do banco) e
   `lib/legal/terms.ts` (`CURRENT_TERMS_VERSION`). Falta a UI (§12.1).
2. **Revisão por advogado.** Os textos foram escritos com cuidado, mas não
   são parecer jurídico. Núcleos de prática jurídica de universidades e a OAB
   costumam fazer isso pro bono para projetos sem fins lucrativos.
3. A Lei 9.608 fala de voluntariado para "entidade" sem fins lucrativos. Se a
   Menvo não tiver CNPJ, a lei vale por analogia; formalizar (associação ou
   similar) reforça.

### 7.3 Menores de idade

**Não bloquear menores.** O público principal (pré-universitário e início da
faculdade) tem muita gente com 16-17 anos. A lei não exige 18+; exige
**proteção**. O que pesa:

| Norma | O que diz | Efeito na Menvo |
|---|---|---|
| LGPD, art. 14 | Dados de crianças e adolescentes: sempre no "melhor interesse". Consentimento de um responsável é exigido para **criança** (até 12 anos, ECA art. 2º). | Adolescente não exige consentimento dos pais para o tratamento de dados... |
| ANPD, Enunciado CD/ANPD nº 1/2023 | Dados de adolescentes podem usar as bases legais do art. 7º/11, respeitado o melhor interesse. | ...confirmado pela ANPD. |
| Código Civil, arts. 3º, 4º e 1.634 | Menor de 16 é absolutamente incapaz (é representado); de 16 a 17, relativamente incapaz (é assistido). | Aceitar os Termos é um contrato: **menor de 16 não aceita sozinho**. |
| ECA (Lei 8.069/1990) e ECA Digital (Lei 15.211/2025) | Proteção integral; serviços de acesso provável por adolescentes precisam de configurações protetivas por padrão e ferramentas para responsáveis. | Menor não pode ficar exposto a abordagem de adultos desconhecidos. **Confirmar com advogado** as obrigações exatas do ECA Digital. |

**Decisão do fundador (2026-09-29): o mínimo, sem burocracia.** Nada de
documento, e-mail ou confirmação de responsável, nem data de nascimento
guardada. É o mesmo modelo das redes sociais: idade autodeclarada, e o
adolescente não fica exposto a abordagem de adultos desconhecidos (é o que as
Contas de Adolescente do Instagram fazem por padrão).

1. **Idade mínima de 16 anos, autodeclarada:** fica na frase do checkbox de
   aceite, "Li e aceito os Termos de Uso e tenho 16 anos ou mais" (§12.1).
2. **Mural só para 18+, autodeclarado:** o texto do toggle "Perfil público"
   diz "Ao ativar, você declara ter 18 anos ou mais". Quem tem 16-17 usa a
   plataforma normalmente (busca, agenda) e só não é abordado. ✅ feito.
3. **Regras para mentores com menores**, na seção `terms.minors` dos Termos:
   sessões pelo link da plataforma, sem pedir contato pessoal nem encontro
   presencial, com canal de denúncia. ✅ feito (pt/en/es).
4. No e-mail aos mentorados (§6.1), o passo 1 menciona o 18+.

Se um dia aparecer um problema real, ou o advogado apontar uma obrigação do
ECA Digital que isso não cubra, dá para endurecer depois.

---

## 8. Open source e contribuições

- Feito: rodapé "Código aberto", seção nos Termos e "Content & UX Writing
  Contributions" no `CONTRIBUTING.md`. Quem escreve textos edita
  `messages/pt-BR.json` direto no GitHub, sem rodar o projeto.
- **Para o mentor UX writer:** responder convidando, com o link do
  CONTRIBUTING, e sugerir começar por um fluxo (cadastro → perfil → agendar)
  como uma issue de escopo. Aviso: várias telas ainda têm texto fixo no
  componente (ex.: `MenteeProfileClient.tsx`, badges e botões do
  `MenteeCard`); listar essas telas numa issue "mover textos para i18n" ajuda
  a revisão.
- Depois: templates de issue (`.github/ISSUE_TEMPLATE/copy.md`), labels
  `good first issue`/`content`, e uma página ou seção de "Quem contribui".

---

## 9. Cronograma

Hoje é terça, 29/09/2026. Segunda, 12/10, é feriado; evitar envios nesse dia.

| Quando | O quê | Quem |
|---|---|---|
| 29/09-02/10 | Deploy das correções do §1 | Paul |
| **29-30/09** | Rodar o diagnóstico do §2 e colar o resultado | Paul |
| 30/09-02/10 | **P0 privacidade** (§2): etapas A e B, RPCs e testes de RLS | Opus |
| 29/09 ✅ | Migrações `community_ready` e `terms_acceptances` escritas; aplicar | Paul |
| 30/09-03/10 | Gate de Termos + idade (§12.1); audiências + templates (§12.2); barra "X% pronto" (§12.3); página do mentorado (§10) | Sonnet |
| **ter 06/10** | **E-mail 1 → mentorados que já acessaram** | Paul (admin) |
| ter 13/10 | Lembrete só para quem continua `community_ready = false` | Paul |
| **qua 14/10** | **Ligar o filtro `community_ready`** no mural | Sonnet (1 linha) |
| **qui 15/10** | **E-mail 2 → mentores**, com o número real de perfis prontos | Paul |
| 13-23/10 | Onboarding guiado (§11), começando pelo tour do mentor no mural | Sonnet |
| 19-30/10 | E-mail intermediado "Oferecer ajuda" (§3) | Opus (spec/RLS) + Sonnet |
| 26-30/10 | Medir: perfis prontos, visitas ao mural, contatos, agendamentos. Decidir sobre o chat (§4) | Paul |

---

## 10. Página do mentorado (`/mentee/[slug]`): revisão

Já corrigido: colunas, `learning_goals`, `noindex`. Falta (Sonnet):

1. **Card "Como entrar em contato"**, no lugar do CTA solto: passo a passo, o
   botão "Copiar mensagem" com o modelo do §6.2 já preenchido com o nome e o
   objetivo do mentorado, e "Abrir LinkedIn". Sem LinkedIn: "Esta pessoa
   ainda não cadastrou um canal de contato" (e, na fase 2, "Oferecer ajuda
   por e-mail").
2. **"Atualizado há X dias"** perto do nome, para o mentor priorizar quem está
   ativo.
3. Mostrar `languages` e `expected_graduation`, que já são buscados e não
   aparecem.
4. **i18n:** toda a página tem texto fixo em PT, e a data usa `pt-BR` fixo.
5. Tirar o ícone pulsante (`animate-pulse`) do avatar, que não significa nada,
   e rever `font-black`/`uppercase` em excesso, que pesa a leitura.
6. O ramo "não público, mas mentor pode ver" do `page.tsx` nunca retorna nada,
   porque a RLS não devolve linhas `is_public = false` para terceiros.
   Simplificar para `notFound()`.

---

## 11. Onboarding guiado

**Biblioteca: [driver.js](https://driverjs.com)**: MIT, ~5 kB gzip, sem
dependências, JS puro (funciona em qualquer framework; em React basta chamar
dentro de um `useEffect`). Alternativas descartadas: Shepherd.js e Intro.js
exigem licença paga para uso comercial ou são AGPL; Reactour e Onborda
amarram a React ou Next.

**Desenho:**

- `lib/onboarding/tours.ts`: tours declarativos por papel. Os passos se
  ancoram em atributos `data-tour="..."`, nunca em classes CSS, para não
  quebrar quando o estilo muda.
  - **Mentorado (1º login):** completar perfil → "Perfil público" → buscar
    mentores → agendar → onde ver as sessões.
  - **Mentor:** disponibilidade → perfil/abordagem → Mural de Mentorados →
    como abordar.
- `components/onboarding/TourLauncher.tsx`: dispara no primeiro acesso a cada
  área e tem um item "Refazer tour" no menu de ajuda.
- Estado: MVP em `localStorage`; depois `profiles.onboarding_completed text[]`,
  para não repetir em outro dispositivo.
- Medir: evento por passo concluído/pulado, para ver onde as pessoas desistem.
- **Complementar com um checklist "Primeiros passos"** persistente no
  dashboard (é o que mais reduz perguntas básicas; o tour é visto uma vez) e
  ligar ao vídeo de onboarding do `FeedbackBanner` e ao assistente/KB (`kb/`)
  para dúvidas frequentes.

---

## 12. Especificação para quem implementa (Sonnet)

Antes de começar: aplicar as migrações `20260929150001` e `20260929150002`
e regenerar `lib/types/supabase.ts`.

### 12.1 Gate de aceite dos Termos (+ idade, quando decidida)

- `components/legal/TermsGate.tsx`, montado no layout autenticado. Se o
  usuário logado não tem linha em `terms_acceptances` com
  `CURRENT_TERMS_VERSION`, abre um modal **não dispensável**: resumo das
  mudanças (voluntário e sem vínculo, contato entre usuários, código aberto),
  links para `/terms` e `/privacy`, e um checkbox "Li e aceito os Termos de Uso
  e tenho 16 anos ou mais" (i18n pt/en/es).
- `POST /api/legal/accept-terms`: servidor, cliente do usuário, faz
  `insert({ user_id, terms_version: CURRENT_TERMS_VERSION, user_agent })`.
  Tratar o erro `23505` (já aceitou) como sucesso. **Não usar `upsert`**, porque
  não há permissão de update.
- No `/signup`, o checkbox de aceite chama a mesma rota logo depois de criar a
  conta. Cadastro por OAuth cai no gate no primeiro acesso.
- Sem campo de idade: a declaração de 16+ é a própria frase do checkbox (§7.3).

### 12.2 Audiências e templates dos e-mails (§6)

- `InviteAudience` ganha `mentees_signed_in` e `mentors_active` em
  `lib/services/invites/audience.service.ts`, com testes no
  `audience.service.test.ts`, seguindo os casos já existentes.
- Templates em `lib/email/`, no padrão de `reengagement-invite`, com os
  textos do §6.1/§6.2; campanhas `community-mentees-2026-10` e
  `community-mentors-2026-10`.
- `{{data_filtro}}` = 14/10/2026; `{{N}}` = contagem de
  `community_ready = true` no dia do envio.

### 12.3 Barra "Seu perfil está X% pronto para o mural"

- No `/profile` de mentorado: um item por condição do §5 (perfil público,
  bio ≥ 80, tópicos ou objetivos, LinkedIn), cada item com um link para o
  campo. O critério fica em `lib/services/community/readiness.ts`,
  **espelhando o SQL** da migração `20260929150001`; um teste garante que os
  limites (80, 40) batem.

### 12.4 Ligar o filtro do mural (14/10)

- Enquanto a RPC do §2 não existir: `.eq("community_ready", true)` em
  `community.service.ts`.

---

## 13. Tirar o acesso a tabelas do navegador (backend como única porta)

**Por quê:** a anon key é pública; mover chamadas para o servidor só protege
quando, no fim, `anon`/`authenticated` **perdem o acesso às tabelas** e o
servidor passa a ser a única porta (validação com Zod, papel checado,
rate limit, log). Sem o passo final (§13.4), a refatoração não muda nada para
um atacante.

### 13.1 Ficam no navegador

- Supabase **Auth** (login, sessão, reset de senha): `lib/auth/auth-context.tsx`,
  `app/[locale]/(auth)/{forgot-password,set-password,update-password,confirm-email}`.
- **Realtime** do chat (`chat.service.ts`, `MessagesBadge.tsx`) enquanto a
  `chat_flag` estiver desligada; revisar se o chat for ligado.

### 13.2 Migrar para rotas `app/api/**` (ordem)

1. `lib/services/quiz/quiz.service.ts` → `POST /api/quiz` e
   `GET /api/quiz/[id]` (o resultado só para o dono ou por token);
   `app/[locale]/quiz/results/[id]/page.tsx` passa a usar a rota.
2. Admin: `admin.service.ts`, `verifications.service.ts`,
   `reports.service.ts`, `app/[locale]/dashboard/admin/users/page.tsx` →
   rotas em `app/api/admin/**` com checagem `is_admin` no servidor (padrão das
   rotas admin que já existem).
3. `favorites.service.ts`, `notifications.service.ts`,
   `app/[locale]/settings/page.tsx` → rotas `app/api/me/**`.
4. `mentors.service.ts` (catálogo) → `GET /api/mentors`,
   `GET /api/mentors/filters`, com cache.
5. `lib/google-calendar-db.ts`: **bug** — usa o cliente de navegador dentro
   de `app/api/calendar/status`, ou seja, sem sessão. Trocar por cliente de
   servidor (ou service role, com checagem do `userId` da sessão). Conferir
   antes se `anon` lê `google_calendar_tokens`.

Regras para cada rota: sessão validada no servidor; `select` com colunas
explícitas (nunca `*`); entrada validada com Zod; mesmo formato de erro das
rotas existentes; testes no padrão de `*.service.test.ts`.

### 13.3 Leitura do próprio perfil

Trocar os `select('*')` do próprio perfil por uma lista explícita:
`lib/auth/server-utils.ts`, `app/auth/callback/route.ts`,
`app/api/auth/me/route.ts`, `app/api/profile/route.ts`,
`app/api/profile/update/route.ts`. É pré-requisito do §13.4.

### 13.4 Fechar a porta (Opus)

Depois de 13.2 e 13.3 no ar e testados: migração que revoga
`select/insert/update/delete` de `anon`/`authenticated` nas tabelas migradas,
e colunas sensíveis de `profiles` (`email`, `phone`, `age`, `address`,
`original_data`...) de `authenticated`. Isso também encerra a etapa B do §2.
Validar com `has_table_privilege`/`has_column_privilege`, como em 2026-09-29.
