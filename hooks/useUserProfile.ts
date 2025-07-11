import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/auth/supabase'
import { useAuth } from '@/hooks/useAuth'
import { UserRoleType } from './usePermissions'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  status: string
  roles: UserRoleType[]
  primary_role?: UserRoleType
  email_confirmed_at?: string
}

// Hook para buscar perfil do usuário logado
export const useUserProfile = () => {
  const { user, isAuthenticated } = useAuth()

  return useQuery<UserProfile | null, Error>({
    queryKey: ['user-profile', 'me', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      // Buscar dados do usuário e seu perfil
      const { data: userData, error: userError } = await supabase
        .from('users')
        // .select(`
        //   id,
        //   email,
        //   email_confirmed_at,
        //   user_profiles!inner(
        //     id,
        //     user_id,
        //     first_name,
        //     last_name,
        //     avatar_url,
        //     status,
        //     roles,
        //     primary_role
        //   )
        // `)
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${userError.message}`)
      }

      if (!userData) return null

      const profile = userData.user_profiles[0]

      return {
        id: profile.id,
        user_id: profile.user_id,
        email: userData.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        status: profile.status,
        email_confirmed_at: userData.email_confirmed_at,
        roles: profile.roles,
        primary_role: profile.primary_role
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para verificar se o usuário tem uma role específica
export const useHasRole = (roleType: UserRoleType) => {
  const { data: userProfile } = useUserProfile()
  
  return userProfile?.roles.includes(roleType) || false
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
  const { data: userProfile } = useUserProfile()
  return userProfile?.primary_role || null
}

// Hook para verificar se o usuário pode acessar funcionalidades de mentor
export const useCanAccessMentorFeatures = () => {
  const { data: userProfile } = useUserProfile()
  
  return userProfile?.roles.includes('mentor') || false
}

// Hook para verificar se o usuário pode acessar funcionalidades de mentee
export const useCanAccessMenteeFeatures = () => {
  const { data: userProfile } = useUserProfile()
  
  return userProfile?.roles.some(role => 
    role === 'mentee' || role === 'mentor'
  ) || false
}

// Hook para verificar se o email do usuário está confirmado
export const useIsEmailConfirmed = () => {
  const { data: userProfile } = useUserProfile()
  return !!userProfile?.email_confirmed_at
}
