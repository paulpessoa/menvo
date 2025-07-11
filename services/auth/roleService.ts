import { createClient } from '@/utils/supabase/client'
import { UserType } from '@/hooks/useSignupForm'

export type UserRole = 'mentee' | 'mentor' | 'admin' | 'company' | 'recruiter'

export interface UserState {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role?: UserRole
  status?: string
  profile_completed?: boolean
  needs_role_selection?: boolean
  is_profile_complete?: boolean
  permissions?: string[]
  created_at?: string
  updated_at?: string
}

export interface RoleUpdateData {
  role: UserRole
}

export interface ProfileCompletionData {
  first_name?: string
  last_name?: string
  bio?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  languages?: string[]
}

class RoleService {
  private supabase = createClient()

  /**
   * Verifica se o usuário tem role definida no JWT
   */
  async checkUserRole(): Promise<UserState | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Role está no JWT, não precisa consultar banco
      const role = user.user_metadata?.role as UserRole
      
      return {
        id: user.id,
        email: user.email || '',
        role: role,
        status: role ? 'active' : 'pending',
        profile_completed: !!role,
        needs_role_selection: !role,
        is_profile_complete: !!role,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    } catch (error) {
      console.error('Erro ao verificar role do usuário:', error)
      return null
    }
  }

  /**
   * Atualiza a role do usuário no JWT
   */
  async updateUserRole(role: UserRole): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado')
      }

      // Atualizar role no JWT
      const { error } = await this.supabase.auth.updateUser({
        data: { role: role }
      })

      if (error) {
        console.error('Erro ao atualizar role no JWT:', error)
        return false
      }

      // Refresh da sessão para aplicar mudanças
      await this.supabase.auth.refreshSession()

      return true
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error)
      return false
    }
  }

  /**
   * Completa o perfil do usuário
   */
  async completeUserProfile(profileData: ProfileCompletionData): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado')
      }

      // Atualizar dados do perfil
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError)
        return false
      }

      // Marcar perfil como completo
      const { error: completeError } = await this.supabase
        .rpc('complete_user_profile', { user_uuid: user.id })

      if (completeError) {
        console.error('Erro ao completar perfil:', completeError)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao completar perfil do usuário:', error)
      return false
    }
  }

  /**
   * Verifica se usuário precisa selecionar role
   */
  async needsRoleSelection(): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return false
      }

      // Verificar role no JWT
      return !user.user_metadata?.role
    } catch (error) {
      console.error('Erro ao verificar necessidade de seleção de role:', error)
      return false
    }
  }

  /**
   * Verifica se perfil está completo
   */
  async isProfileComplete(): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return false
      }

      // Se usuário tem role no JWT, perfil está completo
      return !!user.user_metadata?.role
    } catch (error) {
      console.error('Erro ao verificar se perfil está completo:', error)
      return false
    }
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return false
      }

      const role = user.user_metadata?.role as UserRole
      if (!role) return false

      // Permissões baseadas na role (simplificado)
      const rolePermissions: Record<UserRole, string[]> = {
        mentee: ['view_mentors', 'book_sessions'],
        mentor: ['view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability'],
        admin: ['view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability', 'admin_users', 'admin_verifications', 'admin_system'],
        company: ['view_mentors', 'view_company_profiles', 'manage_company_users'],
        recruiter: ['view_mentors', 'view_candidate_profiles', 'contact_candidates']
      }

      return rolePermissions[role]?.includes(permission) || false
    } catch (error) {
      console.error('Erro ao verificar permissão do usuário:', error)
      return false
    }
  }

  /**
   * Obtém todas as permissões do usuário
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return []
      }

      const role = user.user_metadata?.role as UserRole
      if (!role) return []

      // Permissões baseadas na role (simplificado)
      const rolePermissions: Record<UserRole, string[]> = {
        mentee: ['view_mentors', 'book_sessions'],
        mentor: ['view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability'],
        admin: ['view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability', 'admin_users', 'admin_verifications', 'admin_system'],
        company: ['view_mentors', 'view_company_profiles', 'manage_company_users'],
        recruiter: ['view_mentors', 'view_candidate_profiles', 'contact_candidates']
      }

      return rolePermissions[role] || []
    } catch (error) {
      console.error('Erro ao obter permissões do usuário:', error)
      return []
    }
  }

  /**
   * Obtém o estado completo do usuário
   */
  async getUserState(): Promise<UserState | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      const role = user.user_metadata?.role as UserRole
      
      // Buscar dados do perfil apenas se necessário
      let profile = null
      if (role) {
        const { data: profileData, error: profileError } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profileError) {
          profile = profileData
        }
      }

      // Construir estado do usuário baseado no JWT
      const userState: UserState = {
        id: user.id,
        email: user.email || '',
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        full_name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : undefined,
        role: role,
        status: role ? 'active' : 'pending',
        profile_completed: !!role,
        needs_role_selection: !role,
        is_profile_complete: !!role,
        permissions: role ? this.getRolePermissions(role) : [],
        created_at: profile?.created_at || user.created_at,
        updated_at: profile?.updated_at || user.updated_at
      }

      return userState
    } catch (error) {
      console.error('Erro ao obter estado do usuário:', error)
      return null
    }
  }

  /**
   * Retorna permissões baseadas na role
   */
  private getRolePermissions(role: UserRole): string[] {
    const rolePermissions: Record<UserRole, string[]> = {
      mentee: ['view_mentors', 'book_sessions'],
      mentor: ['view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability'],
      admin: ['view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability', 'admin_users', 'admin_verifications', 'admin_system'],
      company: ['view_mentors', 'view_company_profiles', 'manage_company_users'],
      recruiter: ['view_mentors', 'view_candidate_profiles', 'contact_candidates']
    }

    return rolePermissions[role] || []
  }

  /**
   * Força refresh do token (útil após mudanças de role)
   */
  async refreshToken(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.refreshSession()
      if (error) {
        console.error('Erro ao refresh do token:', error)
      }
    } catch (error) {
      console.error('Erro ao refresh do token:', error)
    }
  }
}

export const roleService = new RoleService() 