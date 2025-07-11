"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"

interface Profile {
  id: string
  email: string
  role: "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"
  status: "pending" | "active" | "inactive" | "suspended"
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  needsRoleSelection: boolean
  needsProfileCompletion: boolean
  needsVerification: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  login: (params: { email: string; password: string }) => Promise<void>
  updateRole: (role: string) => Promise<void>
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

      return data as Profile
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
        } = await supabase.auth.getSession()

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
      throw new Error("Erro ao fazer login. Tente novamente.")
    }
  }

  const updateRole = async (role: string) => {
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

    await refreshProfile()
  }

  // Estados computados
  const isAuthenticated = !!user
  const needsRoleSelection = !!(user && profile?.role === "pending")
  const needsProfileCompletion = !!(user && profile?.role !== "pending" && profile?.status === "pending")
  const needsVerification = !!(user && profile?.role === "mentor" && profile?.status === "pending")

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
    needsRoleSelection,
    needsProfileCompletion,
    needsVerification,
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
