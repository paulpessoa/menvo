import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/auth/supabase'
import { useAuth } from '@/hooks/useAuth'
import { UserRoleType } from './usePermissions'

export interface UserRole {
  role_type: UserRoleType
  is_primary: boolean
  status: 'active' | 'pending' | 'suspended'
}

export interface UserWithRoles {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  status: string
  roles: UserRole[]
  primaryRole?: UserRole
  email_confirmed_at?: string
}

// Hook para buscar roles do usuário logado
export const useUserRoles = () => {
  const { user, isAuthenticated } = useAuth()

  return useQuery<UserWithRoles | null, Error>({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      // Buscar dados do usuário e suas roles
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          status,
          email_confirmed_at,
          user_roles!inner(
            role_type,
            is_primary,
            status
          )
        `)
        .eq('id', user.id)
        .eq('user_roles.status', 'active')
        .single()

      if (userError) {
        throw new Error(`Erro ao buscar roles do usuário: ${userError.message}`)
      }

      if (!userData) return null

      const roles = userData.user_roles as UserRole[]
      const primaryRole = roles.find(role => role.is_primary)

      return {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url,
        status: userData.status,
        email_confirmed_at: userData.email_confirmed_at,
        roles,
        primaryRole
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para verificar se o usuário tem uma role específica
export const useHasRole = (roleType: UserRoleType) => {
  const { data: userWithRoles } = useUserRoles()
  
  return userWithRoles?.roles.some(role => 
    role.role_type === roleType && role.status === 'active'
  ) || false
}

// Hook para verificar se o usuário é mentor
export const useIsMentor = () => useHasRole('mentor')

// Hook para verificar se o usuário é mentee
export const useIsMentee = () => useHasRole('mentee')

// Hook para verificar se o usuário é admin
export const useIsAdmin = () => useHasRole('admin')

// Hook para verificar se o usuário é empresa
export const useIsCompany = () => useHasRole('company')

// Hook para verificar se o usuário é recrutador
export const useIsRecruiter = () => useHasRole('recruiter')

// Hook para obter a role primária do usuário
export const usePrimaryRole = (): UserRoleType | null => {
  const { data: userWithRoles } = useUserRoles()
  return userWithRoles?.primaryRole?.role_type || null
}

// Hook para verificar se o usuário pode acessar funcionalidades de mentor
export const useCanAccessMentorFeatures = () => {
  const { data: userWithRoles } = useUserRoles()
  
  return userWithRoles?.roles.some(role => 
    role.role_type === 'mentor' && 
    role.status === 'active'
  ) || false
}

// Hook para verificar se o usuário pode acessar funcionalidades de mentee
export const useCanAccessMenteeFeatures = () => {
  const { data: userWithRoles } = useUserRoles()
  
  return userWithRoles?.roles.some(role => 
    (role.role_type === 'mentee' || role.role_type === 'mentor') && 
    role.status === 'active'
  ) || false
}

// Hook para verificar se o email do usuário está confirmado
export const useIsEmailConfirmed = () => {
  const { data: userWithRoles } = useUserRoles()
  return !!userWithRoles?.email_confirmed_at
} 