# Design Document

## Overview

Este documento descreve o design técnico para melhorar a funcionalidade da página de perfil, corrigindo problemas críticos com upload de imagem, salvamento de dados e implementando upload de currículo em PDF. O design foca em robustez, experiência do usuário e manutenibilidade.

## Architecture

### Current State Analysis

A página de perfil atual tem os seguintes componentes:
- **Frontend**: React component em `app/profile/page.tsx` usando hooks personalizados
- **State Management**: Hook `useProfile` para gerenciar estado do perfil
- **Storage**: Supabase Storage com bucket `profile-photos` já configurado
- **API**: Endpoint existente `/api/upload/profile-photo` para upload de imagens
- **Database**: Tabela `profiles` com campos para avatar_url e cv_url

### Proposed Architecture

\`\`\`mermaid
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
\`\`\`

## Components and Interfaces

### 1. Enhanced Profile Page Component

**File**: `app/profile/page.tsx`

**Responsibilities**:
- Render profile form with all sections
- Handle form state and validation
- Coordinate file uploads
- Display loading states and error messages
- Manage user feedback

**Key Changes**:
- Replace direct Supabase storage calls with API endpoints
- Add proper error boundaries and loading states
- Implement file validation on frontend
- Add confirmation dialogs for destructive actions

### 2. Enhanced useProfile Hook

**File**: `hooks/useProfile.ts`

**Current Issues**:
- Missing proper error handling for profile updates
- No optimistic updates for better UX
- Limited validation

**Enhancements**:
\`\`\`typescript
interface ProfileUpdateResult {
  success: boolean;
  data?: Profile;
  error?: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<ProfileUpdateResult>;
  uploadAvatar: (file: File) => Promise<ProfileUpdateResult>;
  uploadCV: (file: File) => Promise<ProfileUpdateResult>;
  removeCV: () => Promise<ProfileUpdateResult>;
  refetch: () => Promise<void>;
}
\`\`\`

### 3. New useFileUpload Hook

**File**: `hooks/useFileUpload.ts` (NEW)

**Responsibilities**:
- Handle file validation (type, size)
- Manage upload progress
- Provide reusable upload logic
- Handle upload cancellation

\`\`\`typescript
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
\`\`\`

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

### Profile Table Updates

No schema changes required. Existing fields are sufficient:
- `avatar_url`: string (URL to profile photo)
- `cv_url`: string (URL to CV PDF)

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

\`\`\`typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}
\`\`\`

### User-Friendly Error Messages

\`\`\`typescript
const ERROR_MESSAGES = {
  'FILE_TOO_LARGE': 'Arquivo muito grande. Máximo permitido: 5MB',
  'INVALID_FILE_TYPE': 'Tipo de arquivo não suportado',
  'NETWORK_ERROR': 'Erro de conexão. Tente novamente',
  'UNAUTHORIZED': 'Sessão expirada. Faça login novamente',
  'UPLOAD_FAILED': 'Falha no upload. Tente novamente',
  'PROFILE_UPDATE_FAILED': 'Erro ao salvar perfil. Tente novamente'
};
\`\`\`

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

### Phase 1: Fix Current Issues
- Fix profile data saving
- Improve error handling
- Add proper loading states

### Phase 2: Enhance Image Upload
- Improve image upload reliability
- Add image preview
- Implement file replacement

### Phase 3: Add CV Upload
- Create CV upload API
- Add CV bucket and policies
- Implement CV management UI

### Phase 4: Polish and Optimize
- Add advanced features
- Optimize performance
- Enhance user experience
