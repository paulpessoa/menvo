# Progresso da Remoção: Organizations e Select-Role

## Data: 2026-04-25

## ✅ Concluído

### 1. Traduções do Quiz
- ✅ Mescladas traduções de `messages/quiz/pt-BR.json` em `messages/pt-BR.json`
- ✅ Mescladas traduções de `messages/quiz/en-US.json` em `messages/en.json`
- ✅ Mescladas traduções de `messages/quiz/es-ES.json` em `messages/es.json`

### 2. Build Inicial
- ✅ Build executado com sucesso
- ⚠️ Avisos sobre ESLint (opções antigas, não crítico)
- ⚠️ Avisos sobre BREVO_SMTP (esperado, não impede build)

### 3. Remoção de Organizations - Arquivos Deletados
- ✅ `app/api/profile/organizations/` - API de organizations do usuário
- ✅ `app/api/cron/expire-memberships/` - Cron job de expiração
- ✅ `app/api/cron/expire-invitations/` - Cron job de convites

### 4. Remoção de Organizations - Arquivos Modificados
- ✅ `app/api/mentors/route.ts` - Removido parâmetro `organization_id`
- ✅ `app/api/mentors/visibility/route.ts` - Simplificado para apenas "public"
- ✅ `lib/email/brevo.ts` - Removidas 3 funções:
  - `sendOrganizationInvitation()`
  - `sendOrganizationApprovedEmail()`
  - `sendMembershipExpiredEmail()`
- ✅ `components/header.tsx` - Removido link "Organizações" do menu admin
- ✅ `components/admin/AdminBreadcrumb.tsx` - Removido breadcrumb de organizations
- ✅ `app/[locale]/dashboard/admin/page.tsx` - Removido card "Organizações"
- ✅ `lib/config/routes.ts` - Removidas rotas:
  - `/organizations` (public)
  - `/organizations/new` (protected)

## 🔄 Em Progresso

### Remoção de Organizations - Pendente
- [ ] `lib/rate-limit.ts` - Remover limites de convites de organizations
- [ ] `lib/utils/supabase/service-role.ts` - Atualizar comentários
- [ ] `lib/types/models/mentorship.ts` - Remover `organization_id`
- [ ] `scripts/validation/validate-auth-issues.js` - Remover referências

### Remoção de Select-Role UI - Pendente
- [ ] `app/[locale]/confirmation/page.tsx` - Remover UI de seleção de role
- [ ] `app/api/profile/role/route.ts` - Avaliar se deve ser removido ou mantido
- [ ] `lib/auth/auth-context.tsx` - Avaliar função `selectRole()`

## 📋 Próximos Passos

1. **Finalizar remoção de organizations**
   - Limpar arquivos restantes
   - Comentar tipos do Supabase (não deletar)

2. **Remover UI de select-role**
   - Manter sistema de roles funcionando
   - Remover apenas interface de seleção
   - Garantir que mentor/mentee/admin continuam com acesso correto

3. **Build e validação**
   - Executar build novamente
   - Verificar erros TypeScript
   - Testar fluxos principais

4. **Criar usuários de teste**
   - mentor@menvo.com.br
   - mentee@menvo.com.br
   - Senha: @Citroen.123

5. **Testes via Chrome DevTools MCP**
   - Fluxo de mentor
   - Fluxo de mentee
   - Fluxo de admin

6. **Limpeza de código**
   - Remover `any`
   - Limpar imports não usados
   - Remover variáveis não utilizadas

7. **Deploy**
   - Verificar configurações
   - Build final
   - Push para repositório

## 🎯 Objetivo Final

Sistema sem organizations e sem UI de select-role, mas com sistema de roles (mentor/mentee/admin) funcionando perfeitamente para controle de acesso.