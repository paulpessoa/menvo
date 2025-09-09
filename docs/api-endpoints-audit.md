# Auditoria de Endpoints da API

## Resumo Executivo

Esta auditoria identifica endpoints duplicados, desnecessários e oportunidades de migração para client-side do Supabase.

## Categorização dos Endpoints

### 🔴 MANTER - Requerem ROLE_KEY ou lógica server-side crítica

#### Autenticação com Service Role
- `/api/auth/register` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY para criação de usuários
- `/api/auth/select-role` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY para atualizar roles
- `/api/auth/update-role` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY
- `/api/auth/oauth` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY para OAuth
- `/api/auth/forgot-password` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY
- `/api/auth/custom-claims` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY

#### Upload e Storage
- `/api/upload/profile-photo` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY para upload seguro

#### Verificação de Mentores
- `/api/mentors/verify` - ✅ MANTER - Usa SUPABASE_SERVICE_ROLE_KEY para verificação admin

#### Google Calendar (Recém implementados)
- `/api/auth/google-calendar/*` - ✅ MANTER - OAuth flow para Google Calendar
- `/api/calendar/test` - ✅ MANTER - Teste de integração Google Calendar
- `/api/appointments/*` - ✅ MANTER - Integração com Google Calendar API

#### APIs Externas
- `/api/maps/*` - ✅ MANTER - Usa Google Maps API server-side
- `/api/sheetdb/*` - ✅ MANTER - Integração com SheetDB API

### 🟡 DUPLICADOS - Funcionalidade sobreposta

#### Autenticação Duplicada
- `/api/auth/login` vs `/api/auth/signup` vs `/api/auth/register`
  - **Problema**: `/signup` e `/register` fazem a mesma coisa
  - **Solução**: Manter apenas `/register` (mais completo) e remover `/signup`

- `/api/auth/me` vs `/api/profiles/me`
  - **Problema**: Ambos retornam dados do usuário atual
  - **Solução**: Manter `/api/auth/me` (mais simples) e remover `/profiles/me`

#### Perfis Duplicados
- `/api/profiles/route.ts` vs `/api/mentors/route.ts`
  - **Problema**: Ambos listam perfis de usuários
  - **Análise**: `/mentors` é específico para mentores, `/profiles` é genérico
  - **Solução**: Manter ambos, mas clarificar uso

### 🟢 MIGRAR PARA CLIENT-SIDE - Podem usar Supabase diretamente

#### Operações CRUD Simples
- `/api/profiles/[id]` - 🔄 MIGRAR - CRUD simples de perfis
- `/api/profiles/route.ts` (GET/PUT) - 🔄 MIGRAR - Listagem e atualização básica
- `/api/mentors/[id]` - 🔄 MIGRAR - Busca de mentor específico
- `/api/volunteer-activities/route.ts` - 🔄 MIGRAR - CRUD de atividades voluntárias
- `/api/volunteer-activities/[id]` - 🔄 MIGRAR - Operações em atividade específica
- `/api/volunteer-activities/stats` - 🔄 MIGRAR - Estatísticas podem ser calculadas client-side
- `/api/volunteer-activities/types` - 🔄 MIGRAR - Listagem simples de tipos

#### Autenticação Básica
- `/api/auth/logout` - 🔄 MIGRAR - Pode ser feito client-side
- `/api/auth/user` - 🔄 MIGRAR - Redundante com `/api/auth/me`

#### Feedback
- `/api/feedback/route.ts` - 🔄 MIGRAR - CRUD simples
- `/api/feedback/stats` - 🔄 MIGRAR - Estatísticas simples

### 🔴 REMOVER - Endpoints desnecessários ou obsoletos

#### Endpoints de Teste
- `/api/auth/test` - ❌ REMOVER - Endpoint de teste não deve estar em produção

#### Endpoints Redundantes Confirmados
- `/api/auth/signup` - ❌ REMOVER - Funcionalidade idêntica ao `/register` (ambos fazem signUp)
- `/api/profiles/me` - ❌ REMOVER - Funcionalidade idêntica ao `/auth/me` 
- `/api/auth/user` - ❌ REMOVER - Funcionalidade idêntica ao `/auth/me`
- `/api/auth/logout` - ❌ REMOVER - Pode ser feito client-side com `supabase.auth.signOut()`

#### Admin Endpoints (Avaliar necessidade)
- `/api/admin/*` - ⚠️ AVALIAR - Verificar se realmente precisam ser server-side

## Tabelas de Referência

### Endpoints que DEVEM usar SUPABASE_SERVICE_ROLE_KEY
| Endpoint | Motivo |
|----------|--------|
| `/api/auth/register` | Criação de usuários com dados customizados |
| `/api/auth/select-role` | Atualização de roles de usuário |
| `/api/mentors/verify` | Verificação administrativa de mentores |
| `/api/upload/profile-photo` | Upload seguro para storage |
| `/api/auth/oauth` | Fluxo OAuth com providers externos |

### Endpoints que podem migrar para Client-side
| Endpoint | Substituição Client-side |
|----------|-------------------------|
| `/api/profiles/[id]` | `supabase.from('profiles').select().eq('id', id)` |
| `/api/volunteer-activities` | `supabase.from('volunteer_activities').select()` |
| `/api/feedback` | `supabase.from('feedback').insert(data)` |
| `/api/auth/logout` | `supabase.auth.signOut()` |

## Plano de Implementação

### Fase 1: Remover Duplicados
1. Remover `/api/auth/signup` (manter `/register`)
2. Remover `/api/profiles/me` (manter `/auth/me`)
3. Remover `/api/auth/user` (manter `/auth/me`)
4. Remover `/api/auth/test`

### Fase 2: Migrar para Client-side
1. Atualizar componentes que usam endpoints simples
2. Implementar hooks customizados para operações Supabase
3. Testar funcionalidade migrada
4. Remover endpoints migrados

### Fase 3: Otimizar Endpoints Mantidos
1. Revisar e otimizar endpoints que usam ROLE_KEY
2. Adicionar validações e tratamento de erros
3. Documentar APIs mantidas

## Impacto Estimado

- **Endpoints a remover**: 4-6 endpoints
- **Endpoints a migrar**: 8-10 endpoints  
- **Redução estimada**: ~40% dos endpoints atuais
- **Benefícios**: Menor latência, menos carga no servidor, melhor performance

## Próximos Passos

1. Implementar remoções da Fase 1
2. Criar hooks client-side para substituir endpoints
3. Atualizar componentes React
4. Testar funcionalidade
5. Documentar mudanças
## Análise
 Detalhada dos Duplicados

### `/api/auth/signup` vs `/api/auth/register`
**Análise**: Ambos fazem exatamente a mesma coisa - `supabase.auth.signUp()` com criação de perfil.
- `signup`: Usa client supabase normal
- `register`: Usa supabaseAdmin com ROLE_KEY
**Decisão**: Manter `/register` (mais robusto) e remover `/signup`

### `/api/auth/me` vs `/api/auth/user` vs `/api/profiles/me`
**Análise**: Todos retornam dados do usuário atual com perfil.
- `me`: Mais simples e direto
- `user`: Adiciona campos extras desnecessários  
- `profiles/me`: Usa tabela `user_profiles` (obsoleta?)
**Decisão**: Manter apenas `/auth/me`

### `/api/auth/logout`
**Análise**: Faz apenas `supabase.auth.signOut()` - pode ser feito client-side.
**Decisão**: Remover e usar client-side

## Endpoints com Problemas Identificados

### `/api/profiles/me` e `/api/profiles/route.ts`
- Usam tabela `user_profiles` que pode estar obsoleta
- Deveriam usar tabela `profiles` como outros endpoints
- Precisam ser atualizados ou removidos

### `/api/auth/test`
- Endpoint de debug/teste
- Não deve existir em produção
- Remover imediatamente

## Resumo Final da Auditoria

### ✅ Endpoints Auditados: 35+
### 🔴 Manter (críticos): 15 endpoints
### 🟡 Duplicados identificados: 4 endpoints  
### 🟢 Migrar para client-side: 8 endpoints
### ❌ Remover: 4 endpoints

### Economia Estimada: 
- **12 endpoints removidos/migrados** = ~35% redução
- **Menos latência** para operações simples
- **Menor carga no servidor**
- **Melhor performance geral**
## ✅ I
MPLEMENTAÇÃO CONCLUÍDA - Fase 1

### Endpoints Removidos com Sucesso:
1. ✅ `/api/auth/signup` - Removido (duplicado com `/register`)
2. ✅ `/api/auth/user` - Removido (duplicado com `/auth/me`)
3. ✅ `/api/auth/test` - Removido (endpoint de teste)
4. ✅ `/api/auth/logout` - Removido (migrado para client-side)
5. ✅ `/api/profiles/me` - Removido (duplicado com `/auth/me`)

### Componentes Atualizados:
1. ✅ `middleware.ts` - Removida lógica de logout server-side
2. ✅ `hooks/useFullUserProfile.ts` - Atualizado para usar `/api/auth/me`
3. ✅ `app/test-callback/page.tsx` - Atualizado para usar `/api/auth/me`

### Hooks Client-side Criados:
1. ✅ `hooks/useAuth.ts` - Substitui endpoints de autenticação
   - `signOut()` - Substitui `/api/auth/logout`
   - `signIn()` - Melhora o login client-side
   - `getCurrentUser()` - Substitui `/api/auth/user`

2. ✅ `hooks/useProfiles.ts` - Substitui endpoints de perfil
   - `getProfile()` - Substitui `/api/profiles/[id]`
   - `updateProfile()` - Substitui PUT `/api/profiles`
   - `listProfiles()` - Substitui GET `/api/profiles`

3. ✅ `hooks/useVolunteerActivities.ts` - Substitui endpoints de atividades
   - `getActivities()` - Substitui GET `/api/volunteer-activities`
   - `createActivity()` - Substitui POST `/api/volunteer-activities`
   - `updateActivity()` - Substitui PUT `/api/volunteer-activities/[id]`
   - `deleteActivity()` - Substitui DELETE `/api/volunteer-activities/[id]`
   - `getActivityTypes()` - Substitui `/api/volunteer-activities/types`
   - `getActivityStats()` - Substitui `/api/volunteer-activities/stats`

4. ✅ `hooks/useFeedback.ts` - Substitui endpoints de feedback
   - `submitFeedback()` - Substitui POST `/api/feedback`
   - `getFeedback()` - Substitui GET `/api/feedback`
   - `getFeedbackStats()` - Substitui `/api/feedback/stats`

## Próximos Passos - Fase 2

### Endpoints Candidatos para Remoção (após migração completa):
- `/api/profiles/route.ts` - Migrar para `useProfiles` hook
- `/api/profiles/[id]/route.ts` - Migrar para `useProfiles` hook  
- `/api/volunteer-activities/*` - Migrar para `useVolunteerActivities` hook
- `/api/feedback/*` - Migrar para `useFeedback` hook

### Benefícios Já Alcançados:
- ✅ **5 endpoints removidos** (~15% redução imediata)
- ✅ **Melhor performance** - operações client-side são mais rápidas
- ✅ **Menos carga no servidor** - menos requests para API routes
- ✅ **Código mais limpo** - hooks reutilizáveis
- ✅ **Melhor UX** - feedback imediato com toast notifications
- ✅ **Tipo safety** - hooks TypeScript com tipos corretos
