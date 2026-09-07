# 🗺️ Mapa de Fluxo de Dados e Camadas (Data Flow Architecture)

> **Documento vivo de arquitetura da plataforma Menvo.**  
> Mapeia como os dados são lidos e modificados em cada página, componente e hook, garantindo visibilidade total sobre desacoplamento, BFF e gerenciamento de estado.

---

## 🏗️ Padrões Arquiteturais Definidos

A aplicação opera sob três padrões bem delimitados:

1. **BFF (Backend for Frontend — Rotas `/api/*`):**
   - Usado para operações com efeitos colaterais, sincronização externa (ex: Google Calendar / Google Meet), webhooks, uploads e mutações críticas.
   - Autenticado via cookies de sessão do Next.js.
2. **Camada de Serviços (`lib/services/*`):**
   - Centraliza regras de negócio, agregações e queries ao PostgreSQL/Supabase.
   - **Regra:** Componentes de interface não devem montar queries manuais de banco; devem consumir a camada de serviços ou o BFF.
3. **TanStack Query (Cache e Estado do Servidor):**
   - Utilizado em hooks reativos para gerenciar cache, invalidação automática, revalidação em background e estados de mutação (`useQuery` / `useMutation`).

---

## 📊 Inventário de Telas e Fluxo de Dados

### 1. Dashboard & Core Loop
| Tela / Componente | Como busca dados | Camada Utilizada | Estado do Desacoplamento |
|---|---|---|:---:|
| **Dashboard do Mentorado** (`/dashboard/mentee`) | `mentorshipService`, `mentorService`, `quizService` | Camada de Serviços | ✅ 100% Desacoplado |
| **Dashboard do Mentor** (`/dashboard/mentor`) | `mentorshipService` | Camada de Serviços | ✅ 100% Desacoplado |
| **Próximas Sessões do Mentor** (`MentorUpcomingSessions.tsx`) | Props + link direto ao Google Meet | Componente Puro | ✅ 100% Desacoplado |
| **Ações de Agendamento** (`BookingForm.tsx`) | `POST /api/appointments/create` | BFF (API Route) | ✅ Via BFF |
| **Cancelamento de Mentoria** (`cancel-appointment-button.tsx`) | `POST /api/appointments/cancel` | BFF (API Route) | ✅ Via BFF |
| **Confirmação de Mentoria** (`confirm-appointment-button.tsx`) | `POST /api/appointments/confirm` | BFF (API Route) | ✅ Via BFF |
| **Avaliação de Mentoria** (`complete-appointment-modal.tsx`) | `mentorshipService.submitFeedback` | Camada de Serviços | ✅ 100% Desacoplado |

---

### 2. Catálogo e Busca de Mentores
| Tela / Componente | Como busca dados | Camada Utilizada | Estado do Desacoplamento |
|---|---|---|:---:|
| **Catálogo de Mentores** (`/mentors`) | `mentorService.getCatalogFilterOptions()`, `mentorService.getMentors()` | Camada de Serviços | ✅ 100% Desacoplado |
| **Busca Mágica com IA** (`MagicSearchBar.tsx`) | `POST /api/ai/match` | BFF + OpenAI + Service | ✅ Via BFF |
| **Recomendações da IA** (`/mentors` Banner) | `mentorService.getMentorsByIds()` | Camada de Serviços | ✅ 100% Desacoplado |
| **Avaliações do Mentor** (`MentorshipReviews.tsx`) | `mentorService.getMentorReviews()` | Camada de Serviços | ✅ 100% Desacoplado |

---

### 3. Hooks Customizados e TanStack Query
| Hook | Tipo | Onde busca | Observações |
|---|---|---|---|
| `hooks/useFeedback.ts` | `useQuery` + `useMutation` | `/api/feedback`, `/api/feedback/stats` | TanStack Query via BFF |
| `hooks/useMentors.ts` | `useQuery` | `mentorService.getMentors` | TanStack Query via Service |
| `hooks/useMentorship.ts` | `useQuery` + `useMutation` | `mentorAvailabilityService`, `mentorshipSessionsService` | TanStack Query via Service |
| `hooks/useNewsletter.ts` | `useQuery` + `useMutation` | `newsletterService` | TanStack Query via Service |
| `hooks/useFavorites.ts` | `useQuery` + `useMutation` | Supabase Client direto | ⚠️ Próximo a migrar para `userService.favorites` |
| `hooks/useProfile.ts` | Custom State | `/api/profile` | BFF |
| `hooks/useDebounce.ts` | Utilitário puro | Em memória (Timer) | ✅ Utilitário |

---

### 4. Telas com Consultas Residuais do Supabase (Alvos de Próxima Refatoração)

Para alcançar **100% de desacoplamento** (preparando o terreno para MCP Server e Agente sem dependência acoplada ao Supabase client), os seguintes pontos ainda realizam queries diretas no navegador:

1. `app/[locale]/dashboard/mentor/availability/page.tsx`:
   - ✅ **Migrado:** Desacoplado do `createClient()`. Agora utiliza `mentorAvailabilityService.getMentorAvailability`, `mentorAvailabilityService.setMentorAvailability` e `profileService.updateProfile`.
2. `app/[locale]/mentors/[slug]/page.tsx`:
   - Busca perfil individual por slug no client.
   - **Solução planejada:** Migrar para `mentorService.getMentorBySlug(slug)`.
3. `app/[locale]/messages/page.tsx` & `components/ChatInterface.tsx`:
   - Escuta mensagens em realtime do Supabase.
   - **Solução planejada:** Centralizar em `chatService.subscribeToMessages(...)`.
4. `hooks/useFavorites.ts`:
   - Lê e grava na tabela `user_favorites` diretamente.
   - **Solução planejada:** Migrar para rota `/api/profile/favorites` ou `userService`.

---

## 🛡️ Checklist de Zod nos Endpoints de API

- [x] `/api/feedback` (POST) — `feedbackSchema`
- [x] `/api/profile` (PUT) — `profileSchema`
- [x] `/api/appointments/create` (POST) — `createAppointmentSchema`
- [x] `/api/appointments/cancel` (POST) — `cancelAppointmentSchema`
- [x] `/api/appointments/confirm` (POST) — `confirmAppointmentSchema`
- [x] `/api/appointments/schedule` (POST) — Normalizador resiliente (camelCase/snake_case)
- [x] `/api/ai/match` (POST) — `aiMatchQuerySchema`
- [x] `/api/profile/role` (POST) — `updateUserRoleSchema`
