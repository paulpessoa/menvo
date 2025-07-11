import { supabase } from './supabase'
import { UserRoleType } from '@/hooks/usePermissions'

export interface CreateUserData {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role_type: UserRoleType
}

export interface UpdateUserData {
  first_name?: string
  last_name?: string
  avatar_url?: string
  bio?: string
  location?: string
  current_position?: string
  current_company?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
}

export class UserService {
  async createUser(data: CreateUserData) {
    try {
      // Criar usuário na tabela auth.users (já feito pelo Supabase Auth)
      
      // Criar registro na tabela users_simplified
      const { error: userError } = await supabase
        .from('users_simplified')
        .insert({
          id: data.id,
          email: data.email,
          email_verified: false
        })

      if (userError) throw userError

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles_unified')
        .insert({
          user_id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          avatar_url: data.avatar_url
        })

      if (profileError) throw profileError

      // Criar role inicial do usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.id,
          role_type: data.role_type,
          is_primary: true,
          status: 'active'
        })

      if (roleError) throw roleError

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async updateUser(userId: string, data: UpdateUserData) {
    try {
      const { error } = await supabase
        .from('user_profiles_unified')
        .update(data)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async updateUserRole(userId: string, newRole: UserRoleType) {
    try {
      // Primeiro, desativar a role primária atual
      const { error: deactivateError } = await supabase
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('is_primary', true)

      if (deactivateError) throw deactivateError

      // Verificar se o usuário já tem a nova role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role_type', newRole)
        .single()

      if (existingRole) {
        // Ativar a role existente
        const { error: activateError } = await supabase
          .from('user_roles')
          .update({ is_primary: true, status: 'active' })
          .eq('id', existingRole.id)

        if (activateError) throw activateError
      } else {
        // Criar nova role
        const { error: createError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_type: newRole,
            is_primary: true,
            status: 'active'
          })

        if (createError) throw createError
      }

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao atualizar role do usuário:', error)
      throw new Error(error.message || 'Erro ao atualizar role do usuário')
    }
  }

  async checkEmailConfirmation(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users_simplified')
        .select('email_verified')
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        isConfirmed: data?.email_verified || false,
        confirmedAt: data?.email_verified ? new Date().toISOString() : null
      }
    } catch (error: any) {
      console.error('Erro ao verificar confirmação de email:', error)
      throw new Error(error.message || 'Erro ao verificar confirmação de email')
    }
  }

  async confirmEmail(userId: string) {
    try {
      const { error } = await supabase
        .from('users_simplified')
        .update({ email_verified: true })
        .eq('id', userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao confirmar email:', error)
      throw new Error(error.message || 'Erro ao confirmar email')
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users_simplified')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles_unified')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) throw profileError

      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .eq('status', 'active')
        .single()

      if (roleError) throw roleError

      return {
        ...user,
        ...profile,
        role
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfil do usuário:', error)
      throw new Error(error.message || 'Erro ao buscar perfil do usuário')
    }
  }
}
