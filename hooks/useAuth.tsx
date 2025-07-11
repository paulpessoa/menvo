"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type UserRole = Database["public"]["Enums"]["user_role"]
type UserStatus = Database["public"]["Enums"]["user_status"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean

  // Estados computados
  isAuthenticated: boolean
  needsRoleSelection: boolean
  needsProfileCompletion: boolean
  needsVerification: boolean

  // Permissões
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean

  // Ações
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  login: (params: { email: string; password: string }) => Promise<void>
  updateRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Erro ao obter sessão:", error)
          return
        }

        if (!mounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          if (mounted) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error("Erro ao obter sessão:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (mounted) {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Erro ao fazer logout:", error)
      throw error
    }

    setUser(null)
    setProfile(null)
  }

  const login = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("E-mail ou senha inválidos.")
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Por favor, confirme seu e-mail antes de fazer login.")
      }
      throw new Error("Erro ao fazer login. Tente novamente.")
    }
  }

  const updateRole = async (role: UserRole) => {
    if (!user) throw new Error("Usuário não autenticado")

    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("Erro ao atualizar role:", error)
      throw new Error("Erro ao atualizar role")
    }

    // Refresh do perfil para obter dados atualizados
    await refreshProfile()
  }

  // Estados computados baseados no JWT e perfil
  const userRole = user?.app_metadata?.user_role as UserRole
  const userStatus = user?.app_metadata?.user_status as UserStatus

  const isAuthenticated = !!user
  const needsRoleSelection = !!(user && userRole === "pending")
  const needsProfileCompletion = !!(user && userRole && userRole !== "pending" && profile?.status === "pending")
  const needsVerification = !!(user && userRole === "mentee" && profile?.status === "pending")

  // Sistema de permissões baseado no JWT
  const rolePermissions: Record<UserRole, string[]> = {
    pending: [],
    mentee: ["view_mentors"],
    mentor: ["view_mentors", "provide_mentorship", "manage_availability"],
    admin: [
      "view_mentors",
      "provide_mentorship",
      "manage_availability",
      "admin_users",
      "admin_verifications",
      "admin_system",
    ],
    volunteer: ["view_mentors", "validate_activities"],
    moderator: ["view_mentors", "validate_activities", "moderate_content"],
  }

  const hasPermission = (permission: string): boolean => {
    if (!userRole) return false
    return rolePermissions[userRole]?.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission))
  }

  const hasRole = (role: UserRole): boolean => {
    return userRole === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(userRole)
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
    needsRoleSelection,
    needsProfileCompletion,
    needsVerification,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    signOut,
    refreshProfile,
    login,
    updateRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
