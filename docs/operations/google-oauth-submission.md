# 📋 Kit de Submissão para Verificação do Google OAuth (P0)

> **Documento de Referência Prática** com todos os textos, dados cadastrais, escopos e roteiro de gravação do vídeo exigido pela equipe do Google para aprovação do app **Menvo** no **Google Cloud Console**, eliminando a tela vermelha de *"App não verificado"*.

---

## 1. Informações Cadastrais da Aplicação (OAuth Consent Screen)

Acesse o console em: [Google Cloud Console - Tela de Consentimento OAuth](https://console.cloud.google.com/apis/credentials/consent)

| Campo | Valor Exato para Inserir |
|---|---|
| **App name** | `Menvo` |
| **User support email** | `contato@menvo.com.br` |
| **App logo** | Upload de imagem quadrada (120x120px) do logo Menvo |
| **Application home page** | `https://www.menvo.com.br` |
| **Application privacy policy link** | `https://www.menvo.com.br/privacy` |
| **Application terms of service link** | `https://www.menvo.com.br/terms` |
| **Authorized domains** | `menvo.com.br` |
| **Developer contact email** | `contato@menvo.com.br` |

---

## 2. Escopos Solicitados (Scopes)

### Escopos Não Sensíveis (Non-sensitive)
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `openid`

### Escopo Sensível (Sensitive) - o único que o usuário concede
- **`https://www.googleapis.com/auth/calendar.freebusy`** - mentor conecta a própria agenda só para a Menvo saber se ele está ocupado ou livre (`/mentor/availability`, card "Sincronização Pessoal", atrás da flag `google_calendar_sync_flag`).

> [!IMPORTANT]
> **Não submeter `.../auth/calendar` (nem `calendar.events`).** Ele só é usado no setup mestre (`?action=auth`), que autoriza a conta pessoal do Paul para criar os eventos com Google Meet. Nenhum usuário concede esse escopo, então ele não precisa de verificação; pedi-lo só aumentaria o escopo da revisão. O código de usuário pede apenas `calendar.freebusy` (`app/api/auth/google-calendar/route.ts`, `action=user_auth`).

---

## 3. Justificativa de Uso do Escopo (Scope Justification)

### Pergunta 1: How will your application use the requested scopes?
> "Menvo is a free voluntary mentorship platform. Mentors set weekly availability slots on Menvo. A mentor can optionally connect their Google Calendar so that Menvo hides, from the mentor's public booking page, any slot in which the mentor already has a busy event. Menvo calls the Calendar API 'freebusy.query' method with the 'calendar.freebusy' scope only. We receive only busy time intervals (start and end), never event titles, descriptions, attendees or locations. Menvo never creates, modifies or deletes events on the mentor's calendar and never adds availability; the integration can only remove slots that would conflict. The mentor can disconnect at any time from the same screen, and the stored tokens are deleted on disconnect and when the account is deleted. Use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements."

### Pergunta 2: Why can't you use a less sensitive scope?
> "'calendar.freebusy' is already the narrowest Calendar scope that allows the free/busy query. Without it, mentors would receive booking requests for times when they are busy and would have to check and decline conflicts manually. We do not request calendar.readonly or any event-level scope."

---

## 4. Roteiro para o Vídeo de Demonstração (YouTube Não Listado)

> [!IMPORTANT]
> O Google exige um vídeo curto (1 a 3 minutos) hospedado no YouTube (visibilidade: **Não Listado** / *Unlisted*).
> **Regra obrigatória:** a barra de endereços do navegador deve estar **visível**, mostrando o domínio `https://www.menvo.com.br` e o **Client ID** do Google na URL de consentimento. A tela de consentimento precisa mostrar a permissão de disponibilidade (ocupado/livre).

### Passo a Passo da Gravação:
1. **Apresentação (0:00 - 0:20):** home `https://www.menvo.com.br` e uma frase: *"Menvo is a free voluntary mentorship platform."*
2. **Conexão (0:20 - 0:50):** logado como mentor, abrir `/mentor/availability`, mostrar o card "Sincronização Pessoal" com os textos de "só consulta" e clicar em "Conectar Google Calendar". Mostrar a tela de consentimento do Google com `client_id=...` na barra de endereços e aceitar.
3. **Efeito (0:50 - 1:40):** no Google Agenda, criar um evento marcado como **"Ocupado"** num horário que a Menvo oferece (ex.: 20:30). Abrir o perfil público do mentor, escolher o fluxo de agendamento e mostrar que **aquele horário não aparece mais**. Apagar o evento e mostrar que o horário volta.
4. **Controle do usuário (1:40 - 2:10):** clicar em "Desconectar Agenda" no mesmo card.
5. **Conclusão (2:10 - 2:30):** mostrar `https://www.menvo.com.br/privacy` com a cláusula do Google API Limited Use.

---

## 5. Checklist Final de Submissão

- [x] Política de privacidade com cláusula explícita do Google API Limited Use em `https://www.menvo.com.br/privacy` (Publicada e traduzida).
- [x] Termos de uso em `https://www.menvo.com.br/terms` (Publicados e traduzidos).
- [x] Domínio `menvo.com.br` verificado no Google Search Console sob a mesma conta Google.
- [x] Vídeo gravado e link adicionado na caixa de submissão do Google Cloud Console.
- [x] Clicar em **"Submit for Verification"**.
