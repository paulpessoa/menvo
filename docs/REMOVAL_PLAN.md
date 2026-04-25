# Plano de Remoção: Organizations e Select-Role

## Status: Em Progresso
Data: 2026-04-25

## Objetivo
1. **Organizations**: Remover TODAS as referências do código (manter tabelas no Supabase)
2. **Select-Role**: Remover apenas UI/fluxo de seleção, MANTER sistema de roles funcionando (mentor/mentee/admin devem continuar com acesso correto)

## Arquivos para REMOVER Completamente

### API Routes
1. ✅ `app/api/profile/organizations/route.ts` - GET organizations do usuário
2. ✅ `app/api/cron/expire-memberships/route.ts` - Expira memberships de organizations
3. ✅ `app/api/cron/expire-invitations/route.ts` - Expira convites de organizations

### Páginas Admin
4. ✅ Rotas relacionadas a `/dashboard/admin/organizations/*`

## Arquivos para MODIFICAR (remover referências)

### API Routes
1. `app/api/profile/role/route.ts` - Remover lógica de select-role
2. `app/api/mentors/route.ts` - Remover filtro por organization_id
3. `app/api/mentors/visibility/route.ts` - Remover visible_to_organizations

### Lib/Auth
4. `lib/auth/auth-context.tsx` - Remover função selectRole
5. `lib/config/routes.ts` - Remover rota /organizations

### Components
6. `components/header.tsx` - Remover link para Organizações
7. `components/admin/AdminBreadcrumb.tsx` - Remover breadcrumb de organizations

### Email
8. `lib/email/brevo.ts` - Remover funções:
   - sendOrganizationInvitation
   - sendOrganizationApprovedEmail
   - sendMembershipExpiredEmail

### Types
9. `lib/types/supabase.ts` - Comentar tipos relacionados (manter para compatibilidade com DB)
10. `lib/types/models/mentorship.ts` - Remover organization_id

### Scripts
11. `scripts/validation/validate-auth-issues.js` - Remover referências a select-role

### Rate Limiting
12. `lib/rate-limit.ts` - Remover limites de convites de organizations

### Utils
13. `lib/utils/supabase/service-role.ts` - Atualizar comentários

## Páginas Frontend para Verificar/Remover
1. `app/[locale]/confirmation/page.tsx` - Remover selectRoleDescription
2. `app/[locale]/dashboard/admin/page.tsx` - Remover card de Organizations

## Estratégia de Remoção

### Fase 1: Remover Arquivos Completos
- Deletar arquivos de API que são 100% sobre organizations
- Deletar páginas admin de organizations

### Fase 2: Limpar Referências em Arquivos Existentes
- Remover imports não usados
- Remover funções relacionadas a organizations
- Remover parâmetros organization_id de APIs
- Remover UI elements (botões, links, cards)

### Fase 3: Limpar Types e Interfaces
- Comentar (não deletar) tipos do Supabase relacionados a organizations
- Remover tipos locais que não são mais necessários

### Fase 4: Validação
- Executar build
- Verificar se não há erros de TypeScript
- Testar fluxos principais (mentor, mentee, admin)

## Notas Importantes
- **NÃO** remover tabelas do Supabase
- **NÃO** remover colunas organization_id das tabelas (apenas parar de usar no código)
- Manter compatibilidade com dados existentes no banco
- Documentar mudanças para futuras referências

## Progresso
- [ ] Fase 1: Remover arquivos completos
- [ ] Fase 2: Limpar referências
- [ ] Fase 3: Limpar types
- [ ] Fase 4: Validação e testes