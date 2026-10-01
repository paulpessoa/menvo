# 📡 Menvo API Reference

> **Base URL:** `https://www.menvo.com.br/api`
> **Autenticação:** Cookie `sb-access-token` (Supabase Auth session) — exceto rotas marcadas como 🌐 Pública.
> **Formato:** JSON (`Content-Type: application/json`)

---

## 🔐 Auth

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/auth/me` | 🔒 Session | Retorna o usuário autenticado e seu perfil |
| POST | `/api/auth/logout` | 🔒 Session | Encerra a sessão e limpa os cookies |
| GET | `/api/auth/health` | 🌐 Pública | Health check do serviço de autenticação |

### Google Calendar OAuth
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/auth/google-calendar` | 🔒 Session | Status da conexão do Google Calendar |
| GET | `/api/auth/google-calendar/authorize` | 🔒 Session | Inicia o fluxo OAuth para Google Calendar |
| GET | `/api/auth/google-calendar/callback` | 🌐 Callback | Callback do OAuth do Google Calendar |

---

## 👤 Profile

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/profile` | 🔒 Session | Retorna o perfil completo do usuário logado |
| PUT | `/api/profile/update` | 🔒 Session | Atualiza dados do perfil (nome, bio, foto, etc.) |
| POST | `/api/profile/role` | 🔒 Session | Define o papel do usuário (mentee/mentor) |
| POST | `/api/profile/request-mentor` | 🔒 Session | Solicita verificação como mentor |
| POST | `/api/profile/stop-mentor` | 🔒 Session | Desativa o papel de mentor |
| DELETE | `/api/profile/delete` | 🔒 Session | Exclui a conta do usuário (self-service, LGPD) |

---

## 🎯 Mentors

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/mentors/availability` | 🔒 Session | Lista slots de disponibilidade do mentor logado |
| POST | `/api/mentors/availability` | 🔒 Session | Salva/atualiza slots de disponibilidade |
| GET | `/api/mentors/lookup` | 🌐 Pública | Busca mentores verificados por slug/nome |
| GET | `/api/mentors/settings` | 🔒 Mentor | Configurações do mentor (visibilidade, etc.) |
| PUT | `/api/mentors/visibility` | 🔒 Mentor | Atualiza visibilidade do mentor no catálogo |
| GET | `/api/mentors/[slug]/approach` | 🌐 Pública | Retorna a abordagem/estilo do mentor |

---

## 📅 Appointments (Sessões de Mentoria)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/appointments/list` | 🔒 Session | Lista sessões do usuário (mentee ou mentor) |
| GET | `/api/appointments/availability` | 🔒 Session | Slots disponíveis de um mentor (14 dias) |
| POST | `/api/appointments/create` | 🔒 Mentee | Cria uma solicitação de sessão |
| POST | `/api/appointments/schedule` | 🔒 Mentee | Agenda uma sessão num slot específico |
| POST | `/api/appointments/confirm` | 🔒 Mentor | Confirma uma sessão solicitada |
| POST | `/api/appointments/cancel` | 🔒 Session | Cancela uma sessão agendada |
| POST | `/api/appointments/complete` | 🔒 Session | Marca uma sessão como concluída |
| POST | `/api/appointments/mark-completed` | 🔒 Session | Marca conclusão de sessão passada |
| POST | `/api/appointments/feedback` | 🔒 Mentee | Envia avaliação (1-5 estrelas + depoimento) |

---

## 🤖 AI Assistant

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/assistant` | 🔒 Session | Envia mensagem ao copiloto (SSE streaming) |
| GET | `/api/assistant/briefing` | 🔒 Session | Briefing determinístico (zero tokens) |

---

## 🧠 Diagnostic (Quiz de Carreira)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/quiz` | 🌐 Pública | Submete respostas do quiz (anônimo ou logado) |
| GET | `/api/quiz/latest` | 🔒 Session | Retorna o quiz mais recente do usuário |
| GET | `/api/quiz/[id]` | 🌐 Pública | Retorna resultado de um quiz pelo ID |
| POST | `/api/quiz/[id]/analyze` | 🌐 Pública | Dispara análise de IA para o quiz |
| POST | `/api/quiz/[id]/send-email` | 🌐 Pública | Envia o resultado por email |
| POST | `/api/quiz/[id]/account` | 🌐 Pública | Cria conta a partir do quiz anônimo |

### Compartilhamento de Diagnóstico
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/diagnostic/shares` | 🔒 Session | Lista compartilhamentos (por papel: mentee/mentor) |
| POST | `/api/diagnostic/shares` | 🔒 Mentee | Compartilha diagnóstico com um mentor |
| GET | `/api/diagnostic/shares/[id]` | 🔒 Mentor | Visualiza diagnóstico compartilhado |
| DELETE | `/api/diagnostic/shares/[id]` | 🔒 Mentee | Revoga acesso ao diagnóstico |

---

## 📊 Dashboard

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/dashboard/mentee` | 🔒 Mentee | Dados do dashboard do mentorado |
| GET | `/api/dashboard/mentor` | 🔒 Mentor | Dados do dashboard do mentor |

---

## 🏢 Organizations

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/org/mine` | 🔒 Session | Organizações do usuário logado |
| GET | `/api/org/[id]` | 🔒 Org Admin | Dados completos da organização |
| GET | `/api/org/[id]/members` | 🔒 Org Admin | Lista membros da organização |
| POST | `/api/org/[id]/members` | 🔒 Org Admin | Convida/gerencia membros |
| GET | `/api/me/organizations` | 🔒 Session | Minhas organizações (perspectiva do membro) |

---

## 💌 Invites (Convites de Reengajamento)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/invites/respond` | 🌐 Pública | Aceitar/recusar convite (via token) |
| POST | `/api/invites/delete` | 🌐 Pública | Apagar dados via convite (LGPD, via token) |

---

## ❤️ Favoritos & Notificações

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/me/favorites` | 🔒 Session | Lista mentores favoritos |
| POST | `/api/me/favorites` | 🔒 Session | Adiciona/remove favorito |
| GET | `/api/me/notifications` | 🔒 Session | Lista notificações do usuário |

---

## 💬 Chat (🚫 Desabilitado - `chat_flag = false`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/chat/send` | 🔒 Session | Envia mensagem (retorna 403) |
| GET | `/api/chat/messages/[mentorId]` | 🔒 Session | Mensagens com um mentor |
| POST | `/api/chat/mark-read` | 🔒 Session | Marca mensagens como lidas |

---

## 📝 Feedback & Reports

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/feedback` | 🔒 Session | Envia feedback (assistant/diagnostic/session/platform) |
| GET | `/api/feedback/stats` | 🔒 Admin | Estatísticas de feedback |
| GET | `/api/reports` | 🔒 Admin | Relatórios da plataforma |

---

## 🔧 Feature Flags

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/feature-flags` | 🌐 Pública | Lista feature flags ativas |

---

## 📤 Upload

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/upload/cv` | 🔒 Session | Upload de currículo (PDF) |
| POST | `/api/upload/profile-photo` | 🔒 Session | Upload de foto de perfil |

---

## ⏰ Cron Jobs (Vercel Cron - `CRON_SECRET`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/cron/appointments` | 🔑 CRON_SECRET | Lembretes e status de sessões |
| POST | `/api/cron/ai-retention` | 🔑 CRON_SECRET | Limpeza LGPD de dados de IA |
| POST | `/api/cron/account-retention` | 🔑 CRON_SECRET | Retenção de contas importadas |
| POST | `/api/cron/inactive-retention` | 🔑 CRON_SECRET | Retenção de contas inativas (12 meses) |

---

## 🌐 Misc

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/calendar/status` | 🔒 Session | Status da integração Google Calendar |
| POST | `/api/community/contact` | 🔒 Session | Formulário de contato da comunidade |
| GET | `/api/community` | 🌐 Pública | Dados da comunidade (contagem de mentores, etc.) |
| POST | `/api/contact/organization` | 🌐 Pública | Formulário de contato para organizações |
| POST | `/api/suggestions` | 🌐 Pública | Sugestões da comunidade |
| * | `/api/mcp/[transport]` | 🔒 Session | MCP Server (Model Context Protocol) |

---

## 🔑 Autenticação Supabase (Fora do BFF)

Estas rotas são servidas diretamente pelo Supabase Auth, **não passam pelo nosso backend Next.js**:

| Endpoint Supabase | Descrição |
|---|---|
| `POST /auth/v1/signup` | Criar conta (email + senha) |
| `POST /auth/v1/token?grant_type=password` | Login com senha |
| `POST /auth/v1/recover` | Enviar email de recuperação de senha |
| `GET /auth/v1/authorize` | OAuth (Google, LinkedIn) |
| `POST /auth/v1/logout` | Logout no Supabase |

> **Nota Arquitetural:** A meta é migrar progressivamente todas as chamadas diretas ao Supabase Auth para rotas BFF próprias (`/api/auth/*`), garantindo que a API funcione independente do frontend e esteja pronta para ser consumida por MCPs, SDKs ou integrações externas.
