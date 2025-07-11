"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"

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
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  needsRoleSelection: boolean
  needsProfileCompletion: boolean
  needsVerification: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  login: (params: { email: string; password: string }) => Promise<void>
  signUp: (params: { email: string; password: string; fullName?: string; userType?: string }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Query para buscar perfil do usuário
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
        return null
      }

      return data as Profile
    },
    enabled: !!user?.id,
  })

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

        setSession(session)
        setUser(session?.user ?? null)
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

      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_OUT") {
        queryClient.clear()
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, queryClient])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Erro ao fazer logout:", error)
      throw error
    }
    queryClient.clear()
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

  const signUp = async ({
    email,
    password,
    fullName,
    userType,
  }: {
    email: string
    password: string
    fullName?: string
    userType?: string
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    })

    if (error) {
      if (error.message.includes("User already registered")) {
        throw new Error("Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.")
      }
      throw error
    }

    // Criar perfil inicial se o usuário foi criado
    if (data.user && userType) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email!,
        role: userType as any,
        status: "pending",
        full_name: fullName,
      })

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError)
      }
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      throw error
    }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      throw error
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  }

  const signInWithLinkedIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  }

  const refreshProfile = async () => {
    await refetchProfile()
  }

  // Estados computados baseados no JWT (session)
  const isAuthenticated = !!session?.user
  const needsRoleSelection = !!(session?.user && profile?.role === "pending")
  const needsProfileCompletion = !!(session?.user && profile?.role !== "pending" && profile?.status === "pending")
  const needsVerification = !!(session?.user && profile?.role === "mentor" && profile?.status === "pending")

  const value: AuthContextType = {
    user,
    session,
    profile: profile || null,
    loading,
    isAuthenticated,
    needsRoleSelection,
    needsProfileCompletion,
    needsVerification,
    signOut,
    refreshProfile,
    login,
    signUp,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signInWithLinkedIn,
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
