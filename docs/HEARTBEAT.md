# ❤️ HEARTBEAT - Single Source of Truth

## 📅 Última Atualização: 01/04/2026
**Status Atual:** Mentores i18n ✅ / Suécia Localizada ✅ / Onboarding de Idioma ✅ / Auth i18n (Pendente)

---

## 📍 Onde Paramos?
- **Sessão Iniciada:** Configuração de persona Staff confirmada.
- **Traduções:** Finalizada localização completa para Dinamarquês (da) e Francês (fr). Sincronia de chaves em todos os arquivos.
- **Páginas Públicas:** Refatorada a página de listagem e perfil de mentores para usar `next-intl`.
- **Onboarding:** Implementado `LanguageSelectorOverlay` para forçar escolha de idioma na primeira visita.
- **Auditoria de Auth:** Mapeado que `login-form.tsx` e `register-form.tsx` ainda possuem textos hardcoded.

---

## 🎯 Objetivos de Curto Prazo (P0)
1. [x] **Fix:** Listagem de mentores internacionalizada.
2. [x] **Feat:** Suporte completo a `da`, `fr`, `sv`.
3. [ ] **Fix:** Internacionalizar componentes internos de Auth (Login/Registro).
4. [ ] **Fix:** RLS Policy da tabela `conversations` (Validar em produção).

---

## 🚧 Status das Funcionalidades
- **Agendamento MVP:** ✅ Produção
- **Chat Real-time:** 🚧 Buggy (RLS/Identity issues)
- **Dashboard Mentor:** ✅ Funcional
- **Parceiros/Assíncronas:** ⏳ Backlog

---

## 🛠️ Stack & Contexto Técnico
- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **UI:** Tailwind CSS + Radix/Shadcn
- **Email:** Brevo
- **Calendar:** Google Calendar API

---

## 📝 Notas de Engenharia
- Verificando se a view `mentors` ou a tabela de perfis está com RLS bloqueando a leitura pública ou se o filtro de `chat_enabled` está afetando a listagem geral.
