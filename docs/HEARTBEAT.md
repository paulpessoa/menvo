# ❤️ HEARTBEAT - Single Source of Truth

## 📅 Última Atualização: 30/03/2026
**Status Atual:** Mentores listados ✅ / Migrações Sincronizadas ✅ / Chat RLS (Pendente)

---

## 📍 Onde Paramos?
- **Sessão Iniciada:** Configuração de persona Staff confirmada.
- **Mudança de Modelo:** Atualizado para `gemini-2.5-pro`.
- **Fix Listagem:** Corrigido RLS nas tabelas `roles` e `user_roles` via migração oficial.
- **Sincronia:** Histórico do Supabase reparado e migrações aplicadas em produção.

---

## 🎯 Objetivos de Curto Prazo (P0)
1. [x] **Fix:** Listagem de mentores na página `/mentors`.
2. [ ] **Fix:** RLS Policy da tabela `conversations` (Erro: "new row violates row-level security policy").
3. [ ] **Fix:** Erro "Mentor não encontrado" no sistema de Chat.

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
