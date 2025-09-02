import { useAuth as useAuthContext } from './auth-context'

// Helper functions for role and status checking
export function useAuth() {
  const auth = useAuthContext()

  // Helper methods for role verification
  const hasRole = (role: string) => {
    return auth.role === role
  }

  const hasAnyRole = (roles: string[]) => {
    return roles.includes(auth.role || '')
  }

  const isAdmin = () => hasRole('admin')
  const isMentor = () => hasRole('mentor')
  const isMentee = () => hasRole('mentee')

  // Helper methods for status checking
  const needsRoleSelection = () => {
    return auth.user && !auth.role
  }

  const needsVerification = () => {
    return auth.role === 'mentor' && !auth.isVerified
  }

  const canAccessMentorFeatures = () => {
    return auth.role === 'mentor' && auth.isVerified
  }

  const canAccessAdminFeatures = () => {
    return auth.role === 'admin'
  }

  // Error handling helpers
  const handleAuthError = (error: any) => {
    console.error('Auth error:', error)
    
    // Common error messages mapping
    const errorMessages: Record<string, string> = {
      'Email not confirmed': 'Por favor, confirme seu email antes de fazer login.',
      'Invalid login credentials': 'Email ou senha incorretos.',
      'Email link is invalid or has expired': 'Link expirado. Solicite um novo email.',
      'Email address already confirmed': 'Email já confirmado. Faça login normalmente.',
      'Password recovery requires email confirmation': 'Confirme seu email antes de recuperar a senha.',
      'Email change requires confirmation': 'Verifique seu email para confirmar a alteração.'
    }

    return errorMessages[error.message] || 'Erro inesperado. Tente novamente.'
  }

  // Loading state helpers
  const isInitializing = auth.loading
  const isAuthenticated = !!auth.user && !auth.loading
  const isReady = !auth.loading

  return {
    // Original auth context
    ...auth,

    // Helper methods
    hasRole,
    hasAnyRole,
    isAdmin,
    isMentor,
    isMentee,
    needsRoleSelection,
    needsVerification,
    canAccessMentorFeatures,
    canAccessAdminFeatures,
    handleAuthError,
    isInitializing,
    isAuthenticated,
    isReady
  }
}

// Export types for convenience
export type { AuthContextType, Profile } from './auth-context'