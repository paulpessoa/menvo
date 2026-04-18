import { createClient } from '@/utils/supabase/client'

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
    async updateUserProfile(userId: string, updates: AdminUserUpdate) {
        const { data, error } = await this.supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Gerencia roles de um usuário
     */
    async setUserRoles(userId: string, roleNames: string[]) {
        // 1. Buscar os IDs das roles solicitadas
        const { data: roles, error: rolesError } = await this.supabase
            .from('roles')
            .select('id, name')
            .in('name', roleNames)

        if (rolesError) throw rolesError

        // 2. Remover roles atuais
        const { error: deleteError } = await this.supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)

        if (deleteError) throw deleteError

        // 3. Inserir novas roles
        const inserts = roles.map(role => ({
            user_id: userId,
            role_id: role.id
        }))

        const { error: insertError } = await this.supabase
            .from('user_roles')
            .insert(inserts)

        if (insertError) throw insertError
        return true
    }

    /**
     * Deleta um usuário permanentemente (Cuidado!)
     */
    async deleteUser(userId: string) {
        // Nota: No Supabase, deletar do auth.users requer service_role ou API específica.
        // Aqui deletamos o perfil, o que acionará o cascade se configurado.
        const { error } = await this.supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (error) throw error
        return true
    }
}

export const adminService = new AdminService()
