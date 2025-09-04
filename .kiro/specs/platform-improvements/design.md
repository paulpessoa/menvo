# Design Document

## Overview

Este documento detalha o design técnico para as melhorias da plataforma, incluindo correções de funcionalidades existentes, implementação de sistema de feedback, lista de espera com feature flags, otimização do fluxo de autenticação e migração de usuários.

## Architecture

### Sistema de Voluntários
- **Identificação**: Usar campo `user_role` existente com valor "volunteer" ou adicionar campo boolean `is_volunteer` no perfil
- **Páginas**: Voluntariômetro (público com dados limitados) e Check-in (restrito a voluntários)
- **Dados**: Aproveitar estrutura existente de `volunteer_activities` e endpoints já implementados

### Sistema de Feedback
- **Tabela**: Criar tabela `feedback` no banco de dados
- **Componente**: Aproveitar `FeedbackBanner.tsx` existente que já está implementado
- **API**: Usar endpoint `/api/feedback` existente

### Feature Flags
- **Plataforma Recomendada**: Vercel Edge Config (gratuito, integrado, baixa latência)
- **Alternativa**: LaunchDarkly (plano gratuito limitado)
- **Implementação**: Context Provider para gerenciar flags

### Lista de Espera
- **Tabela**: Criar tabela `waiting_list` 
- **Componente**: Aproveitar `WaitingList.tsx` existente
- **Controle**: Feature flag para alternar entre cadastro normal e lista de espera

## Components and Interfaces

### 1. Sistema de Voluntários

#### Volunteer Role Detection
```typescript
interface VolunteerAccess {
  isVolunteer: (user: User) => boolean
  canAccessVolunteerPages: (user: User) => boolean
}
```

#### Voluntariômetro Enhancement
```typescript
interface VoluntariometroProps {
  showVolunteerForms: boolean // baseado no role do usuário
  publicData: VolunteerStats
  volunteerData?: VolunteerActivity[] // apenas para voluntários
}
```

### 2. Sistema de Feedback

#### Database Schema
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  email TEXT, -- para usuários não autenticados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Feature Flags System

#### Vercel Edge Config Implementation
```typescript
interface FeatureFlags {
  showWaitingList: boolean
  enableFeedback: boolean
  allowNewRegistrations: boolean
}

interface FeatureFlagProvider {
  flags: FeatureFlags
  isLoading: boolean
  refresh: () => Promise<void>
}
```

#### Configuration
```typescript
// lib/feature-flags.ts
export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const response = await fetch(process.env.EDGE_CONFIG_URL!)
    return await response.json()
  } catch {
    return DEFAULT_FLAGS // fallback seguro
  }
}
```

### 4. Lista de Espera

#### Database Schema
```sql
CREATE TABLE waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  reason TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('mentee', 'mentor')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Otimização do Fluxo de Autenticação

#### Auth Flow Logic
```typescript
interface AuthRedirect {
  determineRedirect: (user: User) => string
  shouldShowRoleSelection: (user: User) => boolean
}

// Lógica de redirecionamento
const determineRedirect = (user: User): string => {
  if (!user.user_role || user.user_role === 'pending') {
    return '/auth/select-role'
  }
  
  switch (user.user_role) {
    case 'admin': return '/admin/dashboard'
    case 'mentor': return '/mentor/dashboard'
    case 'mentee': return '/dashboard'
    case 'volunteer': return '/voluntariometro'
    default: return '/dashboard'
  }
}
```

## Data Models

### Enhanced User Profile
```typescript
interface UserProfile {
  id: string
  user_role: 'pending' | 'mentee' | 'mentor' | 'admin' | 'volunteer'
  is_volunteer?: boolean // campo adicional opcional
  // ... outros campos existentes
}
```

### Feedback Model
```typescript
interface Feedback {
  id: string
  user_id?: string
  rating: number // 1-5
  comment?: string
  email?: string // para não autenticados
  created_at: string
  updated_at: string
}
```

### Waiting List Model
```typescript
interface WaitingListEntry {
  id: string
  name: string
  email: string
  whatsapp?: string
  reason: string
  user_type: 'mentee' | 'mentor'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
```

### Migration Data Model
```typescript
interface UserMigration {
  oldUserId: string
  newUserId?: string
  email: string
  userData: Record<string, any>
  migrationStatus: 'pending' | 'completed' | 'failed'
  migrationNotes?: string
}
```

## Error Handling

### API Error Responses
```typescript
interface APIError {
  error: string
  code: string
  details?: Record<string, any>
}

// Códigos de erro padronizados
enum ErrorCodes {
  VOLUNTEER_ACCESS_DENIED = 'VOLUNTEER_ACCESS_DENIED',
  FEEDBACK_SUBMISSION_FAILED = 'FEEDBACK_SUBMISSION_FAILED',
  FEATURE_FLAG_UNAVAILABLE = 'FEATURE_FLAG_UNAVAILABLE',
  MIGRATION_CONFLICT = 'MIGRATION_CONFLICT'
}
```

### Fallback Strategies
- **Feature Flags**: Usar valores padrão quando serviço indisponível
- **Volunteer Access**: Graceful degradation para usuários sem permissão
- **Feedback**: Fallback para armazenamento local temporário
- **Migration**: Rollback automático em caso de falha

## Testing Strategy

### Unit Tests
- Componentes de voluntários com diferentes roles
- Lógica de feature flags com fallbacks
- Validação de dados de feedback e lista de espera
- Fluxo de autenticação e redirecionamento

### Integration Tests
- Endpoints de API para volunteer activities
- Sistema de feedback end-to-end
- Feature flags com Vercel Edge Config
- Processo de migração de usuários

### E2E Tests
- Fluxo completo de voluntário (check-in → visualização no voluntariômetro)
- Submissão de feedback por usuários autenticados e anônimos
- Alternância entre cadastro normal e lista de espera via feature flag
- Redirecionamento correto após login baseado no role

## Feature Flag Platform Comparison

### Vercel Edge Config (Recomendado)
**Prós:**
- Gratuito para projetos Vercel
- Latência ultra-baixa (edge computing)
- Integração nativa com Next.js
- Configuração simples via dashboard

**Contras:**
- Limitado ao ecossistema Vercel
- Funcionalidades básicas comparado a soluções dedicadas

### LaunchDarkly
**Prós:**
- Plataforma madura e robusta
- Recursos avançados (targeting, rollouts graduais)
- SDKs para múltiplas linguagens
- Analytics detalhados

**Contras:**
- Plano gratuito limitado (1000 MAU)
- Complexidade adicional para casos simples
- Custo para escalar

### Recomendação Final
**Usar Vercel Edge Config** para esta implementação devido à simplicidade, custo zero e integração perfeita com a stack atual.

## Migration Strategy

### Identificação de Usuários
1. **Matching por Email**: Estratégia principal
2. **Matching por Dados Únicos**: Nome + telefone como fallback
3. **Resolução de Conflitos**: Interface administrativa para casos ambíguos

### Processo de Migração
1. **Análise**: Identificar usuários da plataforma antiga
2. **Mapeamento**: Mapear campos e roles entre sistemas
3. **Validação**: Verificar integridade dos dados
4. **Migração**: Transferir dados em lotes
5. **Verificação**: Validar migração e notificar usuários

### Estratégias de Conflito
- **Email Duplicado**: Manter usuário mais recente, arquivar antigo
- **Dados Inconsistentes**: Priorizar dados da nova plataforma
- **Roles Incompatíveis**: Mapear para role mais próximo + flag para revisão manual