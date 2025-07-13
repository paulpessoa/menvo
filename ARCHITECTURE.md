# Arquitetura de Autenticação e Permissões (RBAC) - Menvo

Este documento descreve a arquitetura de autenticação e controle de acesso baseado em função (RBAC) implementada na plataforma Menvo.

## 1. Visão Geral

O sistema foi projetado para ser robusto, seguro e escalável, utilizando um fluxo de autenticação baseado em JWT (JSON Web Tokens) com claims customizados, gerenciado pelo Supabase.

O fluxo principal é:
1.  **Autenticação**: O usuário faz login via email/senha ou provedor OAuth.
2.  **Geração de Token**: O Supabase gera um `access_token` (JWT).
3.  **Enriquecimento do Token**: Um **Custom Access Token Hook** é acionado para injetar `claims` (informações) customizados no JWT, como `role` e `permissions`.
4.  **Sessão no Cliente**: O JWT é armazenado de forma segura no cliente (browser).
5.  **Controle de Acesso**:
    *   **Frontend**: O `AuthContext` decodifica o JWT para obter a `role` e as `permissions`, controlando a visibilidade de componentes e o acesso a rotas com o `ProtectedRoute`.
    *   **Backend (RLS)**: As políticas de Row Level Security (RLS) no banco de dados usam o `auth.uid()` e `auth.role()` para controlar o acesso aos dados diretamente no nível do banco.

## 2. Estrutura do Banco de Dados (RBAC)

A base do nosso RBAC são 4 tabelas principais:

-   `public.users` (`auth.users`): Tabela nativa do Supabase que armazena as credenciais de autenticação.
-   `public.profiles`: Estende a tabela `auth.users` com dados públicos e de perfil, incluindo a `role` e o `status` do usuário.
-   `public.roles`: Define as funções disponíveis no sistema (ex: `admin`, `mentor`, `mentee`).
-   `public.permissions`: Define as ações granulares que podem ser executadas (ex: `admin_users`, `book_sessions`).
-   `public.role_permissions`: Tabela de junção que mapeia quais permissões cada `role` possui.

## 3. O Coração do Sistema: Custom Access Token Hook

A peça central da nossa arquitetura é a função PostgreSQL `custom_access_token_hook`.

-   **O que faz?**: É uma função que o Supabase executa *toda vez* que um novo JWT é gerado (login, refresh de token).
-   **Como funciona?**:
    1.  Recebe o `user_id` do usuário que está se autenticando.
    2.  Consulta a tabela `profiles` para obter a `role` atual do usuário.
    3.  Consulta as tabelas `roles`, `role_permissions` e `permissions` para obter uma lista de todas as permissões associadas àquela `role`.
    4.  Injeta essas informações (`role` e `permissions`) como `claims` dentro do payload do JWT.

**Vantagens desta abordagem:**

-   **Eficiência**: O frontend não precisa fazer chamadas extras à API para buscar permissões. Elas já vêm no token.
-   **Segurança**: O JWT é assinado pelo Supabase, garantindo que os `claims` não possam ser adulterados pelo cliente.
-   **Estado Centralizado**: A `role` e as `permissions` são a "fonte da verdade" para o controle de acesso, tanto no cliente quanto no servidor.

## 4. Fluxo no Frontend

### `AuthContext`

-   É o provedor de estado de autenticação para toda a aplicação.
-   Gerencia a sessão do usuário e o estado de `loading`.
-   Na inicialização e em cada mudança de estado de autenticação, ele:
    1.  Obtém o `access_token` da sessão do Supabase.
    2.  Usa a biblioteca `jwt-decode` para extrair os `claims` (`role`, `permissions`).
    3.  Armazena `user`, `profile`, `role` e `permissions` no estado do contexto.
    4.  Disponibiliza essas informações para toda a aplicação através do hook `useAuth`.

### `usePermissions` Hook

-   Um hook de conveniência que consome o `AuthContext`.
-   Fornece funções auxiliares fáceis de usar, como `hasPermission('admin_users')` e `hasRole('admin')`.
-   Simplifica a lógica de verificação de permissões dentro dos componentes.

### `ProtectedRoute` Component

-   Um componente de ordem superior (HOC) que envolve páginas ou componentes que exigem proteção.
-   Usa o `useAuth` e `usePermissions` para verificar:
    1.  Se o usuário está autenticado.
    2.  Se o usuário possui as `requiredPermissions` passadas como prop.
-   Renderiza o conteúdo filho apenas se as condições forem atendidas. Caso contrário, exibe uma mensagem de acesso negado ou redireciona para o login.

## 5. Segurança

-   **JWT**: Os tokens são assinados com um segredo (JWT Secret) no Supabase, prevenindo falsificação.
-   **RLS (Row Level Security)**: A camada final de defesa. Mesmo que um usuário mal-intencionado tente burlar a UI, o RLS no banco de dados impede o acesso não autorizado aos dados. As políticas são definidas para garantir que um usuário só possa ver/editar o que sua `role` permite.
-   **HTTPOnly Cookies**: O Supabase armazena o JWT em cookies `HttpOnly`, o que dificulta o acesso ao token via scripts maliciosos no lado do cliente (XSS).

Esta arquitetura cria um sistema de permissões coeso, seguro e de fácil manutenção, onde o controle de acesso é aplicado de forma consistente desde a interface do usuário até o banco de dados.
