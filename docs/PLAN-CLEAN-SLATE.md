# Estratégia de Reestruturação: Clean Slate (Recomeço Limpo)

Este documento detalha o plano para limpar o débito técnico e redefinir os padrões de qualidade do projeto Menvo.

## 1. Banco de Dados (Supabase)
### Ações:
- [x] **Remover Tabelas Obsoletas**: Executar script `DROP TABLE` para todas as tabelas prefixadas com `z_deleted_`.
- [ ] **Reset de Migrações**: 
    - Fazer um dump do schema atual (`supabase db pull`).
    - Deletar a pasta `supabase/migrations/*`.
    - Criar uma migração única `00000000000000_init.sql` que representa o estado atual "perfeito".
    - Isso evita que novos desenvolvedores tenham que rodar 190+ arquivos de histórico.

## 2. Testes e Qualidade
### Ações:
- [x] **Limpeza**: Deletar a pasta `__tests__` e arquivos `jest.config.js` / `jest.setup.js`.
- [ ] **Nova Stack Proposta**:
    - **Jest + RTL**: Para lógica de componentes e hooks (Unitários).
    - **Playwright**: Para fluxos críticos (Login, Agendamento, Cadastro). *Preferido sobre Cypress pela performance e execução em paralelo nativa.*
- [ ] **Standardization**:
    - Configurar **Husky** para rodar `npm run lint` antes de cada commit.
    - Configurar **SonarCloud** (integrado ao GitHub) para análise estática gratuita.

## 3. Pipeline CI/CD (GitHub Actions)
### Fluxo Sugerido:
1. **Lint & Type Check**: Rodar em cada Pull Request.
2. **Unit Tests**: Rodar se o passo 1 passar.
3. **Build Test**: Garantir que a Vercel não vai quebrar.
4. **E2E (Smoke Tests)**: Rodar apenas em merge para `main`.

---
*Documento preparado por Gemini CLI (Staff Engineer Mindset).*
