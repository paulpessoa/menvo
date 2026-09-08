# 📋 Kit de Submissão para Verificação do Google OAuth (P0)

> **Documento de Referência Prática** com todos os textos, dados cadastrais, escopos e roteiro de gravação do vídeo exigido pela equipe do Google para aprovação do app **Menvo** no **Google Cloud Console**, eliminando a tela vermelha de *"App não verificado"*.

---

## 1. Informações Cadastrais da Aplicação (OAuth Consent Screen)

Acesse o console em: [Google Cloud Console — Tela de Consentimento OAuth](https://console.cloud.google.com/apis/credentials/consent)

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

### Escopos Sensíveis / Restritos (Sensitive Scopes)
- **`https://www.googleapis.com/auth/calendar`** (ou `.../auth/calendar.events`)

---

## 3. Justificativa de Uso do Escopo (Scope Justification)

Copie e cole este texto exato nos campos de justificativa da tela do Google:

### Pergunta 1: How will your application use the requested scopes?
> "Menvo is a voluntary mentorship community platform connecting mentors and mentees for career guidance sessions. The Google Calendar API scope ('https://www.googleapis.com/auth/calendar') is used strictly and exclusively to create calendar events with automatic Google Meet video conference links when a mentor confirms a voluntary mentorship booking. The created events ensure both parties have the meeting scheduled with the appropriate Google Meet link, time, and reminders. Menvo does not read, index, or modify unrelated calendar events, and all data handling strictly complies with the Google API Services User Data Policy, including the Limited Use requirements."

### Pergunta 2: Why can't you use a less sensitive scope?
> "Creating a calendar invite that generates an official Google Meet conference URL requires calendar event creation permissions. Menvo only creates an event when an appointment is explicitly confirmed by both mentor and mentee, without accessing any other personal user calendar entries."

---

## 4. Roteiro para o Vídeo de Demonstração (YouTube Não Listado)

> [!IMPORTANT]
> O Google exige um vídeo curto (1 a 3 minutos) hospedado no YouTube (visibilidade: **Não Listado** / *Unlisted*).
> **Regra obrigatória:** A barra de endereços do navegador deve estar **visível em tela cheia**, mostrando claramente o domínio `https://www.menvo.com.br` e o **Client ID** do Google na URL de consentimento.

### Passo a Passo da Gravação:
1. **Apresentação Inicial (0:00 - 0:20):**
   - Mostre a home da Menvo (`https://www.menvo.com.br`) na barra do navegador.
   - Destaque brevemente: *"Menvo is a free voluntary mentorship platform connecting professionals."*
2. **Fluxo de Login / Consentimento (0:20 - 0:50):**
   - Acesse a tela de conexão/login com o Google.
   - Mostre a tela de consentimento do Google e amplie/mostre a barra de endereços contendo o parâmetro `client_id=...` correspondente ao seu Client ID no Google Cloud Console.
3. **Agendamento da Mentoria (0:50 - 1:20):**
   - Com o perfil de mentorado, acesse `/mentors`, escolha um mentor e faça a solicitação de mentoria para um horário disponível.
4. **Confirmação pelo Mentor e Criação do Google Meet (1:20 - 2:00):**
   - Acesse o painel do mentor (`/dashboard/mentor`) e clique em "Confirmar Mentoria".
   - Mostre o evento sendo gerado no Google Calendar com o link do **Google Meet** gerado automaticamente e o e-mail de confirmação enviado para ambas as partes.
5. **Conclusão:**
   - Encerre mostrando a política de privacidade em `https://www.menvo.com.br/privacy` com a cláusula de conformidade da API do Google.

---

## 5. Checklist Final de Submissão

- [x] Política de privacidade com cláusula explícita do Google API Limited Use em `https://www.menvo.com.br/privacy` (Publicada e traduzida).
- [x] Termos de uso em `https://www.menvo.com.br/terms` (Publicados e traduzidos).
- [x] Domínio `menvo.com.br` verificado no Google Search Console sob a mesma conta Google.
- [ ] Vídeo gravado e link adicionado na caixa de submissão do Google Cloud Console.
- [ ] Clicar em **"Submit for Verification"**.
