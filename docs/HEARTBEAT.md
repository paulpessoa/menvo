# ❤️ HEARTBEAT - Single Source of Truth

## 📅 Última Atualização: 17/04/2026
**Status Atual:** Mentores Modularizados ✅ / Dashboards i18n ✅ / Admin Premium ✅ / Verificação com Chat ✅

---

## 📍 Onde Paramos?
- **Modularização de Mentores:** Extraímos `MentorCard` e `MentorSkeletonCard` para componentes reutilizáveis. A página de listagem agora está limpa e modular.
- **Internacionalização (i18n):**
  - Finalizada internacionalização completa do **Login**, **Signup**, **Dashboard Mentee**, **Dashboard Mentor** e **Admin Dashboard**.
  - Página de **Doação** e **FAQ** 100% bilíngues e com SEO polido.
  - O componente de **Disponibilidade** e o **Chat** agora falam múltiplos idiomas.
- **Sistema de Verificação (MVP+):**
  - Criado `VerificationService` e API `/api/admin/verify`.
  - Admin agora pode aprovar/rejeitar perfis (Mentores/Organizações) com mensagens pré-definidas.
  - **Notificação Automática:** O usuário recebe feedback instantâneo via Chat interno sobre o status do seu perfil.
- **Limpeza de Código:** Removidos componentes obsoletos (`mentor-availability.tsx`, `mentor-filters.tsx`), códigos comentados na Home e logs verbosos de API.

---

## 🎯 Objetivos de Curto Prazo (P0)
1. [x] **Fix:** Internacionalizar Auth (Login/Registro) e Dashboards.
2. [x] **Feat:** Sistema de verificação universal com feedback via Chat.
3. [ ] **Fix:** Validar RLS de `conversations` (Pendência do Heartbeat anterior - Monitorar se o Admin enviando mensagens via Server resolveu os gargalos).
4. [ ] **Feat:** Integrar seção de Eventos (hoje mockada) ao banco de dados.

---

## 🚧 Status das Funcionalidades
- **Agendamento MVP:** ✅ Produção
- **Chat Real-time:** 🟢 Estável (Polido e Internacionalizado)
- **Verificação Admin:** ✅ Premium (Com Chat e Canned Responses)
- **Dashboards:** ✅ Mobile-First & Bilíngues

---

## 🛠️ Stack & Contexto Técnico
- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (SSR)
- **UI:** Tailwind CSS + Radix/Shadcn
- **Internacionalização:** next-intl (da, en, es, fr, pt-BR, sv)
- **Comunicação:** Supabase Realtime (Chat) + Server-side Verification

---

## 📝 Notas de Engenharia
- A unificação da lógica de verificação via API Route (`/api/admin/verify`) permite que o Admin atue como facilitador sem precisar de permissões de escrita excessivamente abertas no client-side.
- O foco em mobile-first nos dashboards melhorou significativamente a usabilidade em dispositivos pequenos.
- Próximo mergulho: Auditar a tabela `events` para substituir os mocks da página pública.
