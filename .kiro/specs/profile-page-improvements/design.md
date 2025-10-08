# Design Document

## Overview

Este documento descreve o design técnico para melhorar a funcionalidade da página de perfil, corrigindo problemas críticos com:
1. **Persistência do CV** - Garantir que arquivos PDF salvos sejam recuperados corretamente após reload
2. **Campos de mentoria** - Restaurar todos os campos específicos para mentores que foram removidos
3. **Campos básicos e profissionais** - Garantir que todos os campos necessários estejam disponíveis
4. **Upload de imagem e salvamento de dados** - Manter funcionalidades existentes

O design foca em robustez, experiência do usuário e manutenibilidade.

## Architecture

### Current State Analysis

A página de perfil atual tem os seguintes componentes:
- **Frontend**: React component em `app/profile/page.tsx` usando hooks personalizados
- **State Management**: Hook `useProfile` para gerenciar estado do perfil
- **Storage**: Supabase Storage com buckets `profile-photos` e `cvs` configurados
- **API**: Endpoints `/api/upload/profile-photo` e `/api/upload/cv` para uploads
- **Database**: Tabela `profiles` com todos os campos necessários

### Problemas Identificados

1. **CV não persiste após reload**: O CV é salvo no banco mas a interface não recupera o estado corretamente
2. **Campos de mentoria ausentes**: Vários campos importantes para mentores foram removidos da interface
3. **Campos básicos incompletos**: Alguns campos como slug do perfil e localização não estão sendo exibidos
4. **Estado da interface inconsistente**: A interface não reflete corretamente o estado dos dados salvos

### Proposed Architecture

```mermaid
graph TB
    A[Profile Page Component] --> B[useProfile Hook]
    A --> C[useFileUpload Hook]
    A --> D[Error Handling Service]
    
    B --> E[Supabase Client]
    C --> F[Upload API Endpoints]
    
    F --> G[/api/upload/profile-photo]
    F --> H[/api/upload/cv - NEW]
    
    G --> I[Supabase Storage - profile-photos]
    H --> J[Supabase Storage - cvs - NEW]
    
    E --> K[Profiles Table]
    
    subgraph "Storage Buckets"
        I
        J
    end
    
    subgraph "Database"
        K
    end
```

## Components and Interfaces

### 1. Enhanced Profile Page Component

**File**: `app/profile/page.tsx`

**Responsibilities**:
- Render profile form with all sections including missing mentor fields
- Handle form state and validation for all fields
- Coordinate file uploads and properly display CV state
- Display loading states and error messages
- Manage user feedback

**Key Changes**:
- **Fix CV state management**: Properly initialize CV state from profile data
- **Add missing mentor fields**: Restore all mentor-specific fields (idiomas, expertise, etc.)
- **Add missing basic fields**: Include slug do perfil, localização, etc.
- **Improve state synchronization**: Ensure UI reflects actual database state
- **Add proper form sections**: Organize fields in appropriate tabs/sections

### 2. Enhanced useProfile Hook

**File**: `hooks/useProfile.ts`

**Current Issues**:
- Profile data loading correctly but UI state not syncing properly
- Missing proper initialization of form state from profile data
- CV state not being properly managed

**Enhancements**:
```typescript
interface Profile {
  // ... existing fields ...
  slug: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languages: string[] | null;
  expertise_areas: string[] | null;
  topics: string[] | null;
  inclusion_tags: string[] | null;
  mentorship_approach: string | null;
  what_to_expect: string | null;
  ideal_mentee: string | null;
  cv_url: string | null;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<ProfileUpdateResult>;
  refetch: () => Promise<void>;
  isUpdating: boolean;
}
```

**Key Fixes**:
- Ensure all profile fields are properly typed and loaded
- Fix form state initialization to properly reflect saved CV state
- Add proper handling for all mentor-specific fields

### 3. New useFileUpload Hook

**File**: `hooks/useFileUpload.ts` (NEW)

**Responsibilities**:
- Handle file validation (type, size)
- Manage upload progress
- Provide reusable upload logic
- Handle upload cancellation

```typescript
interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  endpoint: string;
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  progress: number;
  isUploading: boolean;
  cancel: () => void;
}
```

### 4. New CV Upload API

**File**: `app/api/upload/cv/route.ts` (NEW)

**Responsibilities**:
- Validate PDF files only
- Handle file size limits (5MB)
- Upload to new `cvs` bucket
- Update profile with cv_url
- Remove old CV files when replacing

### 5. Enhanced Error Handling Service

**File**: `lib/error-handler.ts` (NEW)

**Responsibilities**:
- Centralize error message mapping
- Provide user-friendly error messages
- Log errors for debugging
- Handle different error types (network, validation, server)

## Data Models

### Profile Table Schema

The profiles table should include all necessary fields. Key fields for this update:

**Basic Fields**:
- `first_name`, `last_name`: string (required)
- `slug`: string (profile URL slug)
- `bio`: text (user biography)
- `avatar_url`: string (profile photo URL)

**Professional Fields**:
- `current_position`, `current_company`: string
- `linkedin_url`, `portfolio_url`, `personal_website_url`: string
- `cv_url`: string (CV PDF URL)

**Location Fields**:
- `address`, `city`, `state`, `country`: string
- `latitude`, `longitude`: number

**Mentorship Fields**:
- `languages`: string[] (supported languages)
- `expertise_areas`: string[] (areas of expertise)
- `topics`: string[] (mentorship topics)
- `inclusion_tags`: string[] (inclusion/diversity tags)
- `mentorship_approach`: text (mentorship approach description)
- `what_to_expect`: text (what mentees can expect)
- `ideal_mentee`: text (ideal mentee description)

### Storage Buckets

#### Existing: profile-photos
- **Purpose**: Store user profile images
- **File Types**: jpg, png, webp, gif
- **Max Size**: 5MB
- **Naming**: `{user_id}/{timestamp}.{extension}`
- **Public**: Yes

#### New: cvs
- **Purpose**: Store user CV/resume PDFs
- **File Types**: pdf only
- **Max Size**: 5MB
- **Naming**: `{user_id}/cv-{timestamp}.pdf`
- **Public**: Yes (for mentor viewing)

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid file type
   - File too large
   - Missing required fields
   - Invalid data format

2. **Network Errors**
   - Connection timeout
   - Server unavailable
   - Rate limiting

3. **Authentication Errors**
   - Invalid token
   - Expired session
   - Insufficient permissions

4. **Storage Errors**
   - Bucket not found
   - Upload failed
   - File not found

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}
```

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES = {
  'FILE_TOO_LARGE': 'Arquivo muito grande. Máximo permitido: 5MB',
  'INVALID_FILE_TYPE': 'Tipo de arquivo não suportado',
  'NETWORK_ERROR': 'Erro de conexão. Tente novamente',
  'UNAUTHORIZED': 'Sessão expirada. Faça login novamente',
  'UPLOAD_FAILED': 'Falha no upload. Tente novamente',
  'PROFILE_UPDATE_FAILED': 'Erro ao salvar perfil. Tente novamente'
};
```

## Testing Strategy

### Unit Tests

1. **useProfile Hook Tests**
   - Profile fetching
   - Profile updating
   - Error handling
   - Loading states

2. **useFileUpload Hook Tests**
   - File validation
   - Upload progress
   - Error scenarios
   - Cancellation

3. **API Endpoint Tests**
   - File upload success
   - Validation errors
   - Authentication
   - Storage integration

### Integration Tests

1. **Profile Page Tests**
   - Form submission
   - File upload flow
   - Error display
   - Success feedback

2. **Storage Tests**
   - Bucket permissions
   - File upload/download
   - File replacement
   - Cleanup

### E2E Tests

1. **Complete Profile Update Flow**
   - Login → Profile → Update → Save
   - Photo upload → Immediate display
   - CV upload → Link display

## Performance Considerations

### File Upload Optimization

1. **Client-side Compression**
   - Resize images before upload
   - Compress images to reduce size
   - Show preview before upload

2. **Progressive Upload**
   - Show upload progress
   - Allow cancellation
   - Resume interrupted uploads (future)

3. **Caching Strategy**
   - Cache profile data
   - Invalidate on updates
   - Optimistic updates

### Storage Optimization

1. **File Cleanup**
   - Remove old files when replacing
   - Implement cleanup job for orphaned files
   - Set up lifecycle policies

2. **CDN Integration**
   - Use Supabase CDN for faster delivery
   - Implement proper cache headers
   - Optimize image formats

## Security Considerations

### File Upload Security

1. **File Validation**
   - Strict MIME type checking
   - File signature validation
   - Size limits enforcement

2. **Access Control**
   - User can only upload to own folder
   - Authenticated uploads only
   - Rate limiting on uploads

3. **Storage Security**
   - RLS policies on storage buckets
   - Secure file naming
   - No executable file uploads

### Data Privacy

1. **Profile Data**
   - User controls own data
   - Secure data transmission
   - Audit logging for changes

2. **File Access**
   - Public URLs for necessary files only
   - Secure file serving
   - No sensitive data in filenames

## Implementation Phases

### Phase 1: Fix CV Persistence Issue
- Debug and fix CV state initialization from profile data
- Ensure CV upload state is properly reflected in UI
- Fix form state synchronization with database state

### Phase 2: Restore Missing Mentor Fields
- Add all missing mentor-specific fields to the form
- Implement proper form sections and organization
- Add language selection, expertise areas, topics, etc.

### Phase 3: Add Missing Basic Fields
- Add slug do perfil field with URL preview
- Add location fields (address, city, state, country)
- Add privacy notices for location data

### Phase 4: Enhance User Experience
- Improve form validation and feedback
- Add proper loading states for all operations
- Optimize form layout and usability

## UI/UX Improvements

### Form Organization
The profile form should be organized in clear sections:

1. **Informações Básicas**
   - Photo upload
   - Nome, Sobrenome
   - Slug do Perfil (with preview)
   - Biografia

2. **Informações Profissionais**
   - Cargo Atual, Empresa Atual
   - LinkedIn, Portfólio, Site Pessoal
   - CV Upload section

3. **Localização**
   - Endereço completo
   - Cidade, Estado, País
   - Privacy notice

4. **Informações de Mentoria** (for mentors)
   - Idiomas
   - Áreas de Expertise
   - Tópicos de Mentoria
   - Tags Inclusivas
   - Abordagem da Mentoria
   - O que Esperar
   - Mentee Ideal
   - Mentorias Gratuitas notice

### CV State Management
The CV section should clearly show:
- When no CV is uploaded: Upload button with instructions
- When CV is uploaded: File info with View/Remove buttons
- During upload: Progress indicator
- Upload errors: Clear error messages