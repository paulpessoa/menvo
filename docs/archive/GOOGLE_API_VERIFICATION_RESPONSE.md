# Resposta para Verificação do Google API

## Informações para responder ao Google Developer Team

### 1. Justificativa para os Escopos OAuth Solicitados

**Escopo: `https://www.googleapis.com/auth/calendar`**

Nossa aplicação, Menvo, é uma plataforma de mentoria voluntária que conecta mentores e mentorados para sessões gratuitas de orientação profissional. Utilizamos a Google Calendar API exclusivamente para:

1. **Criar eventos de mentoria automaticamente**: Quando um mentor confirma uma sessão de mentoria, criamos automaticamente um evento no Google Calendar com:
   - Data e hora da sessão
   - Duração (45 minutos)
   - Título descritivo da mentoria
   - Descrição com detalhes da sessão
   - Convites automáticos para mentor e mentorado
   - Link do Google Meet para a videochamada

2. **Facilitar a organização**: Ambos os participantes recebem o evento em seus calendários, com lembretes automáticos, garantindo que não percam a sessão agendada.

3. **Uso limitado e transparente**: 
   - Não acessamos, lemos ou modificamos outros eventos do calendário do usuário
   - Não armazenamos dados do calendário em nossos servidores
   - Não compartilhamos dados do calendário com terceiros
   - O acesso é usado apenas no momento da confirmação da mentoria

**Por que precisamos deste escopo:**
- Sem acesso ao Calendar API, não conseguimos criar eventos automaticamente
- Isso prejudicaria significativamente a experiência do usuário, que teria que criar manualmente os eventos
- O escopo `calendar` é o mínimo necessário para criar eventos e enviar convites

---

### 2. Link para Vídeo de Demonstração do OAuth Workflow

**URL do vídeo:** [VOCÊ PRECISA CRIAR E ADICIONAR AQUI]

**O vídeo deve mostrar:**
1. Usuário fazendo login na plataforma Menvo
2. Navegando até a página de agendamento de mentoria
3. Selecionando um mentor e horário
4. Mentor confirmando a sessão
5. **Tela de consentimento OAuth do Google aparecendo** (mostrando os escopos solicitados)
6. Usuário autorizando o acesso
7. Evento sendo criado no Google Calendar
8. Convites sendo enviados para ambos os participantes

**Dicas para o vídeo:**
- Use uma ferramenta como Loom, OBS Studio ou Camtasia
- Mostre claramente a tela de consentimento OAuth
- Mostre o evento criado no Google Calendar
- Duração recomendada: 2-3 minutos
- Adicione legendas explicando cada etapa

---

### 3. Política de Privacidade Atualizada

**URL:** https://menvo.com.br/privacy

A política de privacidade foi atualizada e agora inclui:

✅ **Seção de Coleta de Dados**: Descreve claramente quais dados coletamos
✅ **Seção de Uso de Dados**: Explica como utilizamos os dados coletados
✅ **Seção de Compartilhamento de Dados**: Detalha com quem compartilhamos dados e por quê
✅ **Seção específica do Google Calendar API**: Explica:
   - Que usamos a API apenas para criar eventos de mentoria
   - Quais dados acessamos (data, hora, participantes)
   - Que não armazenamos ou compartilhamos dados do calendário
   - Como o usuário pode revogar o acesso

✅ **Seção de Serviços de Terceiros**: Lista todos os serviços utilizados (Google, LinkedIn, Supabase, Brevo)
✅ **Seção de Direitos do Usuário**: Explica como solicitar acesso, correção ou exclusão de dados
✅ **Informações de Contato**: contato@menvo.com.br

---

## Template de Resposta ao Google

```
Hello Google Developer Team,

Thank you for reviewing our application. We have addressed all the issues highlighted:

### 1. Justification for OAuth Scopes

We require the `https://www.googleapis.com/auth/calendar` scope exclusively to create mentorship session events in Google Calendar when a mentor confirms a session with a mentee.

**Specific use case:**
- When a mentorship session is confirmed, we automatically create a calendar event with session details (date, time, duration, description)
- We send calendar invitations to both mentor and mentee
- We generate a Google Meet link for the video call
- We do NOT access, read, or modify any other calendar events
- We do NOT store calendar data on our servers
- We do NOT share calendar data with third parties

This scope is the minimum required to provide this essential functionality. Without it, users would need to manually create calendar events, significantly degrading the user experience.

### 2. OAuth Consent Screen Workflow Video

Demo video URL: [YOUR_VIDEO_URL_HERE]

The video demonstrates:
- User logging into Menvo platform
- Navigating to mentorship scheduling
- Mentor confirming a session
- OAuth consent screen appearing with requested scopes
- User authorizing access
- Calendar event being created successfully
- Invitations sent to both participants

### 3. Updated Privacy Policy

Privacy Policy URL: https://menvo.com.br/privacy

Our privacy policy now includes comprehensive sections on:
- Data Collection: What data we collect and how
- Data Usage: How we use collected data
- Data Sharing: Clear description of third-party data sharing, including:
  * Supabase (secure storage)
  * Brevo (transactional emails)
  * Google (OAuth authentication and Calendar API)
  * LinkedIn (OAuth authentication)
- Google Calendar API: Dedicated section explaining:
  * We use the API only to create mentorship events
  * What data we access (date, time, participants)
  * We do not store or share calendar data
  * How users can revoke access
- User Rights: How to request access, correction, or deletion of data
- Contact Information: contato@menvo.com.br

All sections are clearly labeled and easy to find.

We believe these updates fully address the requirements for verification. Please let us know if you need any additional information.

Best regards,
Menvo Team
contato@menvo.com.br
```

---

## Próximos Passos

1. **Criar o vídeo de demonstração**:
   - Grave o fluxo completo do OAuth
   - Mostre claramente a tela de consentimento
   - Faça upload no YouTube (pode ser não listado)
   - Adicione o link no template acima

2. **Verificar a política de privacidade**:
   - Acesse https://menvo.com.br/privacy
   - Confirme que todas as seções estão visíveis
   - Teste em diferentes idiomas (pt-BR, en, es)

3. **Responder ao Google**:
   - Use o template acima
   - Adicione o link do vídeo
   - Responda diretamente ao e-mail recebido

4. **Aguardar revisão**:
   - O Google geralmente responde em 3-5 dias úteis
   - Fique atento ao e-mail para possíveis perguntas adicionais

---

## Informações Adicionais

**Domínio verificado:** menvo.com.br
**App Homepage:** https://menvo.com.br
**Privacy Policy:** https://menvo.com.br/privacy
**Terms of Service:** https://menvo.com.br/terms
**Cookie Policy:** https://menvo.com.br/cookies

**Contato:**
- Email: contato@menvo.com.br
- Email pessoal (para desenvolvimento): paulmspessoa@gmail.com

**Projeto Google Cloud:**
- Project ID: menvo-460822
- Project Number: 428487318740
