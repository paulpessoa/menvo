# Design Document

## Overview

Este design visa restaurar a funcionalidade de login social (Google e LinkedIn) no formulário de login, conectando a implementação OAuth existente que já está disponível no sistema. A solução envolve modificar o componente `LoginForm` para utilizar a função `signInWithProvider` do contexto de autenticação, removendo o código TODO e implementando o tratamento adequado de erros.

## Architecture

### Current State
- `LoginForm` component tem botões de login social desabilitados com mensagem "Login social temporariamente indisponível"
- `AuthContext` já possui função `signInWithProvider` implementada
- `oauth-provider-fixes.ts` contém implementação completa de OAuth com tratamento de erros
- Sistema de redirecionamento pós-login já funcional

### Target State
- `LoginForm` utilizará `signInWithProvider` do contexto de autenticação
- Tratamento de erros específicos para cada provedor OAuth
- Feedback visual adequado durante o processo de autenticação
- Integração com o fluxo de redirecionamento existente

## Components and Interfaces

### Modified Components

#### LoginForm Component (`components/auth/login-form.tsx`)
\`\`\`typescript
// Current problematic function
const handleSocialLogin = async (provider: "google" | "linkedin") => {
    setIsSocialLoading(provider)
    setError("")
    // TODO: Implement social login with new auth flow
    setError("Login social temporariamente indisponível")
    setIsSocialLoading(null)
}

// New implementation
const handleSocialLogin = async (provider: "google" | "linkedin") => {
    setIsSocialLoading(provider)
    setError("")
    
    try {
        await signInWithProvider(provider)
        // Success handling is done by AuthContext
        onSuccess?.()
    } catch (error: any) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
    } finally {
        setIsSocialLoading(null)
    }
}
\`\`\`

### Existing Components (No Changes Required)

#### AuthContext (`lib/auth/auth-context.tsx`)
- `signInWithProvider` function already implemented
- `handleAuthError` function available for error translation
- OAuth integration with `oauth-provider-fixes.ts` already in place

#### OAuth Provider Fixes (`lib/auth/oauth-provider-fixes.ts`)
- Complete OAuth implementation with error handling
- Provider-specific configurations for Google and LinkedIn
- Enhanced error messages in Portuguese

## Data Models

### Error Handling Flow
\`\`\`typescript
interface OAuthError {
    message: string
    provider: 'google' | 'linkedin'
    type: 'configuration' | 'network' | 'user_cancelled' | 'invalid_credentials'
}

interface OAuthResult {
    success: boolean
    error?: OAuthError
    redirectUrl?: string
}
\`\`\`

### State Management
\`\`\`typescript
interface LoginFormState {
    email: string
    password: string
    isLoading: boolean
    isSocialLoading: 'google' | 'linkedin' | null
    error: string
}
\`\`\`

## Error Handling

### OAuth Error Categories

1. **Configuration Errors**
   - Missing client ID/secret
   - Invalid redirect URL configuration
   - Provider not enabled in Supabase

2. **Network Errors**
   - Connection timeout
   - Provider service unavailable
   - DNS resolution issues

3. **User Errors**
   - User cancelled authentication
   - Invalid credentials
   - Account not found

4. **Provider-Specific Errors**
   - Google: Consent screen issues, API quotas
   - LinkedIn: Scope permissions, profile access

### Error Message Mapping
\`\`\`typescript
const errorMessages = {
    'Invalid login credentials': 'Falha na autenticação. Verifique suas credenciais.',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'Invalid redirect URL': 'Erro de configuração. Contate o suporte.',
    'User cancelled': 'Autenticação cancelada pelo usuário.',
    'Network error': 'Erro de conexão. Tente novamente.',
    'Provider unavailable': 'Serviço temporariamente indisponível.'
}
\`\`\`

## Testing Strategy

### Unit Tests
1. **LoginForm Component Tests**
   - Test social login button clicks
   - Test loading states during OAuth
   - Test error message display
   - Test successful authentication flow

2. **OAuth Integration Tests**
   - Test provider configuration validation
   - Test error handling for different scenarios
   - Test redirect URL generation

### Integration Tests
1. **End-to-End OAuth Flow**
   - Test complete Google OAuth flow
   - Test complete LinkedIn OAuth flow
   - Test error scenarios with mock providers

2. **Error Handling Tests**
   - Test configuration error scenarios
   - Test network error scenarios
   - Test user cancellation scenarios

### Manual Testing Checklist
1. **Google OAuth**
   - [ ] Click Google login button
   - [ ] Verify redirect to Google
   - [ ] Complete authentication
   - [ ] Verify redirect back to app
   - [ ] Verify user is logged in

2. **LinkedIn OAuth**
   - [ ] Click LinkedIn login button
   - [ ] Verify redirect to LinkedIn
   - [ ] Complete authentication
   - [ ] Verify redirect back to app
   - [ ] Verify user is logged in

3. **Error Scenarios**
   - [ ] Test with invalid configuration
   - [ ] Test network disconnection
   - [ ] Test user cancellation
   - [ ] Verify error messages are in Portuguese

## Implementation Notes

### Key Changes Required
1. Replace TODO implementation in `handleSocialLogin` function
2. Import and use `signInWithProvider` from `useAuth` hook
3. Import and use `handleAuthError` for error translation
4. Maintain existing UI/UX patterns

### Dependencies
- No new dependencies required
- Utilizes existing OAuth implementation
- Leverages current error handling system

### Configuration Requirements
- Ensure Google OAuth credentials are configured in Supabase
- Ensure LinkedIn OAuth credentials are configured in Supabase
- Verify redirect URLs are properly configured
- Confirm OAuth providers are enabled in Supabase dashboard

### Security Considerations
- OAuth flows use secure HTTPS redirects
- State parameters prevent CSRF attacks
- Tokens are handled by Supabase client library
- No sensitive data stored in localStorage

## Rollback Plan

If issues arise after implementation:
1. Revert `handleSocialLogin` function to display "temporarily unavailable" message
2. Add feature flag to disable social login if needed
3. Monitor error logs for OAuth-related issues
4. Provide alternative email/password login path
