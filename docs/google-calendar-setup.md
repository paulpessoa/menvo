# Configuração do Google Calendar API

Este guia explica como configurar a integração com Google Calendar para criar eventos automaticamente quando mentorias são confirmadas.

## Pré-requisitos

- Conta Google
- Projeto no Google Cloud Console
- Acesso ao painel de administração da aplicação

## Passo 1: Configurar Google Cloud Console

### 1.1 Criar/Selecionar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto

### 1.2 Habilitar Calendar API
1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por "Google Calendar API"
3. Clique em **Enable**

### 1.3 Criar Credenciais OAuth 2.0
1. Vá em **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Se solicitado, configure a tela de consentimento OAuth:
   - Escolha **External** (para uso público)
   - Preencha as informações obrigatórias
   - Adicione os escopos: `calendar` e `calendar.events`
4. Selecione **Web application**
5. Configure:
   - **Name**: MENVO Calendar Integration
   - **Authorized redirect URIs**: 
     - `https://seu-dominio.vercel.app/api/auth/google-calendar/callback`
     - `http://localhost:3000/api/auth/google-calendar/callback` (para desenvolvimento)

### 1.4 Obter Credenciais
1. Após criar, copie:
   - **Client ID**
   - **Client Secret**

## Passo 2: Configurar Variáveis de Ambiente

### 2.1 Adicionar no Vercel (Produção)
\`\`\`bash
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id_aqui
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALENDAR_REDIRECT_URI=https://seu-dominio.vercel.app/api/auth/google-calendar/callback
\`\`\`

### 2.2 Adicionar no .env.local (Desenvolvimento)
\`\`\`bash
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id_aqui
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
\`\`\`

## Passo 3: Obter Refresh Token

### 3.1 Gerar URL de Autorização
\`\`\`bash
GET /api/auth/google-calendar?action=auth
\`\`\`

Ou acesse: `https://seu-dominio.vercel.app/api/auth/google-calendar?action=auth`

### 3.2 Autorizar Aplicação
1. Acesse a URL retornada
2. Faça login com a conta Google que será usada para criar eventos
3. Autorize os escopos solicitados
4. Copie o código de autorização da URL de callback

### 3.3 Trocar Código por Tokens
\`\`\`bash
POST /api/auth/google-calendar
Content-Type: application/json

{
  "code": "codigo_de_autorizacao_aqui"
}
\`\`\`

### 3.4 Adicionar Refresh Token
Copie o `refresh_token` da resposta e adicione às variáveis de ambiente:

\`\`\`bash
GOOGLE_CALENDAR_REFRESH_TOKEN=seu_refresh_token_aqui
\`\`\`

## Passo 4: Testar Configuração

### 4.1 Verificar Configuração
\`\`\`bash
GET /api/calendar/test-config
\`\`\`

### 4.2 Testar Criação de Evento
\`\`\`bash
POST /api/calendar/test
\`\`\`

## Fluxo de Funcionamento

1. **Mentee solicita mentoria** → Agendamento criado com status "pending"
2. **Mentor confirma mentoria** → Chama `/api/appointments/confirm`
3. **Sistema cria evento no Google Calendar** com:
   - Título: "Mentoria: [Nome Mentor] & [Nome Mentee]"
   - Descrição: Detalhes da mentoria e observações
   - Participantes: Emails do mentor e mentee
   - Google Meet: Link gerado automaticamente
   - Lembretes: 1 dia antes (email) e 30 min antes (popup)
4. **Agendamento atualizado** → Status muda para "confirmed"

## Endpoints Disponíveis

### Confirmar Agendamento
\`\`\`bash
POST /api/appointments/confirm
{
  "appointmentId": "uuid"
}
\`\`\`

### Cancelar Agendamento
\`\`\`bash
POST /api/appointments/cancel
{
  "appointmentId": "uuid",
  "reason": "Motivo do cancelamento"
}
\`\`\`

### Configuração OAuth
\`\`\`bash
GET /api/auth/google-calendar?action=auth  # Obter URL de autorização
POST /api/auth/google-calendar             # Trocar código por tokens
\`\`\`

### Testes
\`\`\`bash
GET /api/calendar/test-config              # Verificar configuração
POST /api/calendar/test                    # Criar evento de teste
\`\`\`

## Componentes React

### ConfirmAppointmentButton
\`\`\`tsx
import { ConfirmAppointmentButton } from '@/components/appointments/confirm-appointment-button'

<ConfirmAppointmentButton
  appointment={appointment}
  onConfirmed={(updatedAppointment) => {
    // Atualizar estado local
  }}
/>
\`\`\`

### CancelAppointmentButton
\`\`\`tsx
import { CancelAppointmentButton } from '@/components/appointments/cancel-appointment-button'

<CancelAppointmentButton
  appointment={appointment}
  onCancelled={(updatedAppointment) => {
    // Atualizar estado local
  }}
/>
\`\`\`

### AppointmentCard
\`\`\`tsx
import { AppointmentCard } from '@/components/appointments/appointment-card'

<AppointmentCard
  appointment={appointment}
  currentUserId={user.id}
  onAppointmentUpdate={(updatedAppointment) => {
    // Atualizar lista de agendamentos
  }}
/>
\`\`\`

## Troubleshooting

### Erro: "Missing environment variables"
- Verifique se todas as variáveis estão configuradas
- Reinicie a aplicação após adicionar variáveis

### Erro: "Failed to connect to Google Calendar API"
- Verifique se o refresh token é válido
- Reautorize a aplicação se necessário

### Erro: "Calendar API not enabled"
- Habilite a Calendar API no Google Cloud Console
- Aguarde alguns minutos para propagação

### Erro: "Invalid redirect URI"
- Verifique se a URI de redirecionamento está correta
- Adicione todas as URIs necessárias (produção e desenvolvimento)

## Segurança

- **Nunca** exponha as credenciais no frontend
- Use apenas endpoints de API para operações do Calendar
- O refresh token permite acesso contínuo - mantenha seguro
- Considere rotacionar tokens periodicamente

## Limitações

- A conta Google usada para autorização será a "proprietária" dos eventos
- Todos os eventos serão criados no calendário principal desta conta
- Rate limits da Google Calendar API se aplicam
- Eventos são criados no fuso horário America/Sao_Paulo
