import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/types/database"

type UserRole = Database["public"]["Enums"]["user_role"]
type AppPermission = Database["public"]["Enums"]["app_permission"]

/**
 * Verifica se o usuário atual tem uma permissão específica
 */
export async function hasPermission(permission: AppPermission): Promise<boolean> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const userRole = user.app_metadata?.user_role as UserRole
    if (!userRole) return false

    const { data } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role", userRole)
      .eq("permission", permission)
      .single()

    return !!data
  } catch (error) {
    console.error("Erro ao verificar permissão:", error)
    return false
  }
}

/**
 * Verifica se o usuário atual tem pelo menos uma das permissões
 */
export async function hasAnyPermission(permissions: AppPermission[]): Promise<boolean> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const userRole = user.app_metadata?.user_role as UserRole
    if (!userRole) return false

    const { data } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role", userRole)
      .in("permission", permissions)

    return (data?.length || 0) > 0
  } catch (error) {
    console.error("Erro ao verificar permissões:", error)
    return false
  }
}

/**
 * Verifica se o usuário atual tem uma role específica
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const userRole = user.app_metadata?.user_role as UserRole
    return userRole === role
  } catch (error) {
    console.error("Erro ao verificar role:", error)
    return false
  }
}

/**
 * Obtém todas as permissões do usuário atual
 */
export async function getUserPermissions(): Promise<AppPermission[]> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const userRole = user.app_metadata?.user_role as UserRole
    if (!userRole) return []

    const { data } = await supabase.from("role_permissions").select("permission").eq("role", userRole)

    return data?.map((p) => p.permission) || []
  } catch (error) {
    console.error("Erro ao obter permissões:", error)
    return []
  }
}

/**
 * Obtém a role do usuário atual
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    return (user.app_metadata?.user_role as UserRole) || null
  } catch (error) {
    console.error("Erro ao obter role:", error)
    return null
  }
}
