# ❤️ HEARTBEAT - Single Source of Truth

## 📅 Última Atualização: 30/03/2026
**Status Atual:** Mentores listados ✅ / Dash Admin Global ✅ / Chat RLS Corrigido ✅ / i18n Expandido ✅

---

## 📍 Onde Paramos?
- **Sessão Iniciada:** Configuração de persona Staff confirmada.
- **Mudança de Modelo:** Atualizado para `gemini-2.5-pro`.
- **Fix Listagem:** Corrigido RLS nas tabelas `roles` e `user_roles`.
- **i18n:** Migrado para `next-intl` com suporte a Dinamarquês, Francês e Sueco.
- **Dash Admin:** Criado painel global de usuários com métricas de engajamento e controle de mentores.
- **Chat RLS:** Aplicada migração definitiva para corrigir erros de permissão em conversas e mensagens.

---

## 🎯 Objetivos de Curto Prazo (P0)
1. [x] **Fix:** Listagem de mentores na página `/mentors`.
2. [x] **Fix:** RLS Policy da tabela `conversations`.
3. [x] **Feat:** Gestão global de usuários e métricas no Admin.
4. [x] **i18n:** Adicionar suporte a `da`, `fr`, `sv`.

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
