# 🏗️ ARCHITECTURE EVOLUTION - Rumo ao Monorepo

Este documento serve como bússola para a transição do projeto Menvo de uma aplicação monolítica para uma estrutura de **Isolamento por Domínios** (Vertical Slicing) utilizando Monorepo.

## 🎯 Visão de Longo Prazo

O objetivo é separar as preocupações de negócio, permitindo que cada frente evolua de forma independente sem comprometer a estabilidade do ecossistema.

### 🏛️ Divisão de Domínios (Nomenclatura)

1.  **`client` (ou `main`):** Focado no B2C. Landing page, busca de mentores, blog e perfil do aluno. (Alta necessidade de SEO).
2.  **`organizations` (B2B):** Focado no Institucional. Painel para empresas e ONGs gerenciarem seus grupos, membros e relatórios ESG.
3.  **`staff` (ou `admin`):** Focado na Operação. Moderação de mentores, gestão de usuários e auditoria de feedbacks de plataforma.
4.  **`auth` (Centralizado):** Serviço único de autenticação e redirecionamento de roles.

## 📡 Estratégia de APIs (`app/api/`)

Em um ambiente de domínios isolados, a gestão das APIs deve seguir uma destas abordagens:

*   **APIs de Domínio:** Cada app mantém suas rotas `api/` para lógicas específicas de UI (ex: upload de assets locais).
*   **Unified Backend (Recomendado):** Centralizar lógicas de escrita e regras complexas de banco em **Supabase Edge Functions** ou em um serviço de API isolado. Isso evita que a regra de "Como aprovar uma organização" tenha que ser duplicada entre o app de Admin e o app de Organizações.

## 💬 Sistema de Feedbacks: Plataforma vs. Mentoria

Precisamos distinguir dois fluxos distintos de feedback que hoje residem em lugares diferentes:

### 1. Feedback de Plataforma (Voice of Customer)
*   **Propósito:** Saber o que os usuários acham da Menvo, bugs e sugestões de features.
*   **Gestão:** Painel `staff` (Admin).
*   **Status:** Implementado (Tabela `feedback`).

### 2. Feedback de Mentoria (Review de Serviço)
*   **Propósito:** Avaliar a qualidade de uma sessão específica realizada com um mentor.
*   **Gestão:** Dashboard do Mentor e Perfil Público do Mentor (Social Proof).
*   **Tabela Sugerida:** `appointment_feedbacks`.
*   **Status:** A desenhar (P0 nos próximos ciclos).

## 🚀 Próximos Passos para a Migração (Roadmap)

1.  **Extração do Design System:** Mover componentes Shadcn/UI para `packages/ui`.
2.  **Unificação da Camada de Dados:** Criar `packages/database` para centralizar tipos do Supabase e instâncias de clientes SSR.
3.  **Spin-off do Dashboard Admin:** Mover `/dashboard/admin/**` para seu próprio repositório/workspace.
