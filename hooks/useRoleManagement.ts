import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleService, type UserRole, type UserState, type ProfileCompletionData } from '@/services/auth/roleService'
import { toast } from 'sonner'

// Hook para verificar estado do usuário
export function useUserState() {
  return useQuery({
    queryKey: ['user-state'],
    queryFn: () => roleService.getUserState(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

// Hook para verificar se usuário precisa selecionar role
export function useNeedsRoleSelection() {
  return useQuery({
    queryKey: ['needs-role-selection'],
    queryFn: () => roleService.needsRoleSelection(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

// Hook para verificar se perfil está completo
export function useIsProfileComplete() {
  return useQuery({
    queryKey: ['is-profile-complete'],
    queryFn: () => roleService.isProfileComplete(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

// Hook para obter permissões do usuário
export function useUserPermissions() {
  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: () => roleService.getUserPermissions(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

// Hook para verificar permissão específica
export function useHasPermission(permission: string) {
  return useQuery({
    queryKey: ['has-permission', permission],
    queryFn: () => roleService.hasPermission(permission),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

// Hook para atualizar role do usuário
export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (role: UserRole) => roleService.updateUserRole(role),
    onSuccess: async (success) => {
      if (success) {
        // Invalidar queries relacionadas
        await queryClient.invalidateQueries({ queryKey: ['user-state'] })
        await queryClient.invalidateQueries({ queryKey: ['needs-role-selection'] })
        await queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
        await queryClient.invalidateQueries({ queryKey: ['has-permission'] })
        
        // Refresh do token para aplicar mudanças
        await roleService.refreshToken()
        
        toast.success('Role atualizada com sucesso!')
      } else {
        toast.error('Erro ao atualizar role')
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar role:', error)
      toast.error('Erro ao atualizar role. Tente novamente.')
    },
  })
}

// Hook para completar perfil do usuário
export function useCompleteUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileData: ProfileCompletionData) => roleService.completeUserProfile(profileData),
    onSuccess: async (success) => {
      if (success) {
        // Invalidar queries relacionadas
        await queryClient.invalidateQueries({ queryKey: ['user-state'] })
        await queryClient.invalidateQueries({ queryKey: ['is-profile-complete'] })
        
        toast.success('Perfil completado com sucesso!')
      } else {
        toast.error('Erro ao completar perfil')
      }
    },
    onError: (error) => {
      console.error('Erro ao completar perfil:', error)
      toast.error('Erro ao completar perfil. Tente novamente.')
    },
  })
}

// Hook para refresh do token
export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => roleService.refreshToken(),
    onSuccess: async () => {
      // Invalidar todas as queries de auth
      await queryClient.invalidateQueries({ queryKey: ['user-state'] })
      await queryClient.invalidateQueries({ queryKey: ['needs-role-selection'] })
      await queryClient.invalidateQueries({ queryKey: ['is-profile-complete'] })
      await queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
      await queryClient.invalidateQueries({ queryKey: ['has-permission'] })
    },
    onError: (error) => {
      console.error('Erro ao refresh do token:', error)
    },
  })
}

// Hook combinado para gerenciar estado completo do usuário
export function useUserRoleManagement() {
  const userState = useUserState()
  const needsRoleSelection = useNeedsRoleSelection()
  const isProfileComplete = useIsProfileComplete()
  const userPermissions = useUserPermissions()
  const updateUserRole = useUpdateUserRole()
  const completeUserProfile = useCompleteUserProfile()
  const refreshToken = useRefreshToken()

  return {
    // Estados
    userState: userState.data,
    needsRoleSelection: needsRoleSelection.data,
    isProfileComplete: isProfileComplete.data,
    userPermissions: userPermissions.data,
    
    // Estados de loading
    isLoading: userState.isLoading || needsRoleSelection.isLoading || isProfileComplete.isLoading || userPermissions.isLoading,
    
    // Estados de erro
    hasError: userState.isError || needsRoleSelection.isError || isProfileComplete.isError || userPermissions.isError,
    
    // Mutations
    updateUserRole,
    completeUserProfile,
    refreshToken,
    
    // Funções utilitárias
    hasPermission: (permission: string) => userPermissions.data?.includes(permission) || false,
    hasAnyPermission: (permissions: string[]) => permissions.some(p => userPermissions.data?.includes(p) || false),
    hasAllPermissions: (permissions: string[]) => permissions.every(p => userPermissions.data?.includes(p) || false),
    
    // Refresh de dados
    refetch: () => {
      userState.refetch()
      needsRoleSelection.refetch()
      isProfileComplete.refetch()
      userPermissions.refetch()
    }
  }
} 