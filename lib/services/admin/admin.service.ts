import { createClient } from '@/lib/utils/supabase/client'
import type { Database } from '@/lib/types/supabase'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface AdminUserUpdate {
    first_name?: string
    last_name?: string
    bio?: string
    avatar_url?: string
    verified?: boolean
    verification_notes?: string
    is_public?: boolean
}

class AdminService {
    private supabase = createClient()

    /**
     * Atualiza dados de qualquer perfil (apenas admins via RLS)
     */
    async updateUserProfile(userId: string, updates: AdminUserUpdate): Promise<ProfileRow> {
        const updatePayload: ProfileUpdate = {
            ...updates,
            updated_at: new Date().toISOString()
        }

        const { data, error } = await this.supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data as ProfileRow
    }

    /**
     * Gerencia roles de um usuário de forma consistente
     */
    async setUserRoles(userId: string, roleNames: string[]): Promise<boolean> {
        // 1. Buscar os IDs das roles solicitadas
        const { data: rolesRaw, error: rolesError } = await this.supabase
            .from('roles')
            .select('id, name')
            .in('name', roleNames)

        if (rolesError) throw rolesError
        const roles = (rolesRaw as { id: string; name: string }[]) || []

        // 2. Remover roles atuais
        const { error: deleteError } = await this.supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)

        if (deleteError) throw deleteError

        if (roles.length === 0) return true

        // 3. Inserir novas roles
        const inserts = roles.map(role => ({
            user_id: userId,
            role_id: role.id
        }))

        const { error: insertError } = await (this.supabase
            .from('user_roles') as any)
            .insert(inserts)

        if (insertError) throw insertError
        return true
    }

    /**
     * Deleta um usuário permanentemente
     */
    async deleteUser(userId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (error) throw error
        return true
    }
}

export const adminService = new AdminService()
