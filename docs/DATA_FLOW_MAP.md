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
| `hooks/useFavorites.ts` | `useQuery` + `useMutation` | `favoritesService` | TanStack Query via Service |
| `hooks/useProfile.ts` | Custom State | `/api/profile` | BFF |
| `hooks/useDebounce.ts` | Utilitário puro | Em memória (Timer) | ✅ Utilitário |

---

### 4. Status de Desacoplamento da Interface (100% Concluído 🎉)

Todas as queries diretas ao banco foram migradas para a camada de **Serviços** ou rotas **BFF**, cumprindo 100% a diretriz de arquitetura do `AGENTS.md`:

1. `app/[locale]/dashboard/mentor/availability/page.tsx`:
   - ✅ **Migrado:** Desacoplado do `createClient()`. Utiliza `mentorAvailabilityService` e `profileService`.
2. `app/[locale]/mentors/[slug]/page.tsx`:
   - ✅ **Migrado:** Desacoplado de queries diretas no RSC. Utiliza `mentorPublicService.getMentorBySlugOrId(slug)`.
3. `app/[locale]/messages/page.tsx` & `components/ChatInterface.tsx`:
   - ✅ **Migrado:** Desacoplado de queries diretas e canais soltos. Utiliza `chatService.getConversations`, `chatService.subscribeToUserChats`, `chatService.subscribeToConversation` e `chatService.broadcastTyping`.
4. `hooks/useFavorites.ts`:
   - ✅ **Migrado:** Desacoplado de `createClient()`. Utiliza `favoritesService.getFavorites` e `favoritesService.toggleFavorite`.

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
