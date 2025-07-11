import { useEffect, useState } from 'react'
import { useSession } from '@supabase/auth-helpers-react'
import { UserService } from '../services/auth/userService'
import { usePermissions } from './usePermissions'
import { supabase } from '../services/auth/supabase'

export interface UserState {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  role: string
  emailConfirmed: boolean
  loading: boolean
  error: Error | null
}

const userService = new UserService()

export function useUser() {
  const session = useSession()
  const { hasPermission } = usePermissions()
  const [userState, setUserState] = useState<UserState>({
    id: '',
    email: '',
    role: 'viewer',
    emailConfirmed: false,
    loading: true,
    error: null
  })

  useEffect(() => {
    async function loadUserData() {
      if (!session?.user) {
        setUserState(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        // Carregar dados do usuário simplificado
        const { data: user, error: userError } = await supabase
          .from('users_simplified')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        // Carregar dados do perfil
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles_unified')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') throw profileError // PGRST116 é o código para "não encontrado"

        // Carregar role atual
        const { data: role, error: roleError } = await supabase
          .from('user_roles')
          .select('role_type')
          .eq('user_id', session.user.id)
          .eq('is_primary', true)
          .eq('status', 'active')
          .single()

        if (roleError) throw roleError

        setUserState({
          id: user.id,
          email: user.email,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          avatarUrl: profile?.avatar_url,
          role: role.role_type,
          emailConfirmed: user.email_verified,
          loading: false,
          error: null
        })
      } catch (error) {
        setUserState(prev => ({
          ...prev,
          loading: false,
          error: error as Error
        }))
      }
    }

    loadUserData()
  }, [session])

  const updateRole = async (newRole: string) => {
    if (!session?.user) return

    try {
      setUserState(prev => ({ ...prev, loading: true }))
      await userService.updateUserRole(session.user.id, newRole as any)
      setUserState(prev => ({ ...prev, role: newRole, loading: false }))
    } catch (error) {
      setUserState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }))
    }
  }

  const confirmEmail = async () => {
    if (!session?.user) return

    try {
      setUserState(prev => ({ ...prev, loading: true }))
      await userService.confirmEmail(session.user.id)
      setUserState(prev => ({ ...prev, emailConfirmed: true, loading: false }))
    } catch (error) {
      setUserState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }))
    }
  }

  return {
    ...userState,
    updateRole,
    confirmEmail,
    hasPermission
  }
}
