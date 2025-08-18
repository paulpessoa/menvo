# Guia de Consolidação da Autenticação - MENVO

## Resumo das Mudanças Implementadas

### 1. ✅ Consolidação da Lógica de Autenticação

**Problema Resolvido:**
- Múltiplos hooks de autenticação causando inconsistências
- Lógica duplicada entre `useAuth.tsx` e `useAuth.consolidated.tsx`
- `AuthContext` reimplementando funcionalidades já existentes

**Solução Implementada:**
- **Removido:** `hooks/useAuth.tsx` (arquivo duplicado)
- **Refatorado:** `app/context/auth-context.tsx` agora usa internamente o `useAuth.consolidated.tsx`
- **Atualizado:** `components/auth/AuthGuard.tsx` para usar o hook consolidado
- **Mantida:** Compatibilidade com componentes existentes através da interface do contexto

### 2. ✅ Verificação e Correção do Schema do Banco

**Estrutura Confirmada:**
```sql
-- Tabela principal (CORRETA)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    -- outros campos...
);

-- Tabelas relacionadas (CORRETAS)
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    -- outros campos...
);

CREATE TABLE public.validation_requests (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    -- outros campos...
);
```

**Conclusão:** A estrutura está correta. A tabela `profiles` usa `id` como PK que referencia `auth.users(id)`, e as outras tabelas usam `user_id` para referenciar `profiles(id)`.

### 3. ✅ Sincronização user_metadata e profiles

**Problema:**
- Dados do perfil não sincronizados com `user_metadata` do JWT
- Middleware não tinha acesso aos dados atualizados do perfil

**Solução Implementada:**
- **Criado:** Trigger `sync_user_metadata_trigger` que atualiza automaticamente o `raw_user_meta_data` em `auth.users` sempre que `profiles` é modificado
- **Melhorado:** JWT Custom Access Token Hook para incluir dados mais completos
- **Adicionado:** Função `sync_all_user_metadata()` para sincronizar dados existentes

## Como Aplicar as Mudanças

### Passo 1: Aplicar Migração no Supabase Dashboard

1. **Acesse o Supabase Dashboard:** https://supabase.com/dashboard
2. **Selecione o projeto Menvo**
3. **Vá para SQL Editor**
4. **Copie e cole o conteúdo completo do arquivo:** `APPLY_TO_REMOTE_SUPABASE.sql`
5. **Execute o script** (clique em "Run")

### Passo 2: Configurar o JWT Hook no Supabase

1. Vá para **Authentication > Hooks** no painel do Supabase
2. Configure o **Custom Access Token Hook**:
   - **Hook Name:** `custom_access_token_hook`
   - **Function:** `public.custom_access_token_hook`
   - **Enable:** ✅ Ativado

### Passo 3: Verificar a Aplicação

O próprio script `APPLY_TO_REMOTE_SUPABASE.sql` já inclui queries de verificação no final que mostrarão:
- ✅ Funções criadas
- ✅ Trigger configurado  
- ✅ Número de perfis sincronizados

### Passo 4: Testar o Sistema

1. **Teste de Login:**
   ```bash
   # No seu ambiente de desenvolvimento
   npm run dev
   ```

2. **Verificar JWT Claims:**
   - Faça login com um usuário
   - Abra o Developer Tools > Application > Local Storage
   - Procure por `supabase.auth.token`
   - Decodifique o JWT em [jwt.io](https://jwt.io) e verifique se contém:
     ```json
     {
       "role": "mentor|mentee|admin|etc",
       "status": "active|pending|etc",
       "permissions": ["array", "of", "permissions"],
       "user_id": "uuid",
       "first_name": "Nome",
       "last_name": "Sobrenome"
     }
     ```

## Benefícios da Consolidação

### 🎯 Consistência
- **Antes:** 3 implementações diferentes de autenticação
- **Depois:** 1 fonte única de verdade (`useAuth.consolidated.tsx`)

### 🚀 Performance
- **Antes:** Múltiplas chamadas desnecessárias ao banco
- **Depois:** Cache inteligente e sincronização automática

### 🔒 Segurança
- **Antes:** Dados desatualizados no middleware
- **Depois:** JWT sempre sincronizado com dados do perfil

### 🛠️ Manutenibilidade
- **Antes:** Mudanças precisavam ser feitas em múltiplos lugares
- **Depois:** Mudanças centralizadas no hook consolidado

## Arquivos Modificados

### ✅ Modificados
- `app/context/auth-context.tsx` - Refatorado para usar hook consolidado
- `components/auth/AuthGuard.tsx` - Atualizado import

### ✅ Removidos
- `hooks/useAuth.tsx` - Removido para evitar confusão

### ✅ Criados
- `supabase/migrations/20250817000000_sync_user_metadata.sql` - Migração de sincronização
- `scripts/apply_auth_consolidation.sql` - Script de verificação
- `AUTH_CONSOLIDATION_GUIDE.md` - Este guia

## Próximos Passos Recomendados

1. **Aplicar as migrações** conforme descrito acima
2. **Testar thoroughly** o fluxo de autenticação
3. **Monitorar logs** para identificar possíveis problemas
4. **Atualizar testes** para usar o novo sistema consolidado
5. **Documentar** mudanças para a equipe

## Troubleshooting

### Problema: JWT não contém claims customizados
**Solução:** Verificar se o Custom Access Token Hook está configurado corretamente no Supabase.

### Problema: Dados não sincronizando
**Solução:** Executar `SELECT public.sync_all_user_metadata();` no SQL Editor.

### Problema: Componentes quebrados
**Solução:** Verificar se estão usando a interface correta do `useAuth()` - a interface foi mantida para compatibilidade.

---

**Status:** ✅ Implementação Completa
**Próxima Ação:** Aplicar migrações no banco de dados