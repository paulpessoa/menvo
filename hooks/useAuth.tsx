"use client"

import { createClient, isSupabaseConfigured } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

// Hook para operações de autenticação
export const useAuthOperations = () => {
  const getSupabaseClient = () => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase não está configurado. Verifique as variáveis de ambiente.")
    }

    const client = createClient()
    if (!client) {
      throw new Error("Não foi possível criar o cliente Supabase.")
    }

    return client
  }

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    try {
      console.log("🔄 Iniciando signUp:", { email, fullName })

      const nameParts = fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          firstName,
          lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Erro no signUp:", data.error)
        throw new Error(data.error)
      }

      console.log("✅ SignUp bem-sucedido:", data.user?.id)
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no signUp:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔄 Iniciando signIn:", { email })

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        console.error("❌ Erro no signIn:", error)
        throw error
      }

      console.log("✅ SignIn bem-sucedido:", data.user?.id)
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no signIn:", error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log("🔄 Iniciando Google OAuth")

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("❌ Erro no Google OAuth:", error)
        throw error
      }

      console.log("✅ Google OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no Google OAuth:", error)
      throw error
    }
  }

  const signInWithLinkedIn = async () => {
    try {
      console.log("🔄 Iniciando LinkedIn OAuth")

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("❌ Erro no LinkedIn OAuth:", error)
        throw error
      }

      console.log("✅ LinkedIn OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no LinkedIn OAuth:", error)
      throw error
    }
  }

  const signInWithGitHub = async () => {
    try {
      console.log("🔄 Iniciando GitHub OAuth")

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("❌ Erro no GitHub OAuth:", error)
        throw error
      }

      console.log("✅ GitHub OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no GitHub OAuth:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log("🔄 Iniciando signOut")

      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ Erro no signOut:", error)
        throw error
      }

      console.log("✅ SignOut bem-sucedido")
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no signOut:", error)
      throw error
    }
  }

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithGitHub,
    signOut,
  }
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const operations = useAuthOperations()

  const fetchUserProfile = async (userId: string) => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase não configurado, pulando busca de perfil")
      return null
    }

    try {
      setProfileLoading(true)
      const supabase = createClient()
      if (!supabase) return null

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      return null
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (!isSupabaseConfigured()) {
        console.warn("Supabase não configurado, pulando inicialização de auth")
        if (mounted) {
          setLoading(false)
        }
        return
      }

      try {
        const supabase = createClient()
        if (!supabase) {
          if (mounted) {
            setLoading(false)
          }
          return
        }

        // Obter sessão atual
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Erro ao obter sessão:", error)
        }

        if (mounted) {
          setUser(session?.user ?? null)
          setIsAuthenticated(!!session?.user)

          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user.id)
            setProfile(userProfile)
          }

          setLoading(false)
        }

        // Escutar mudanças na autenticação
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id)

          if (mounted) {
            setUser(session?.user ?? null)
            setIsAuthenticated(!!session?.user)

            if (session?.user && event === "SIGNED_IN") {
              const userProfile = await fetchUserProfile(session.user.id)
              setProfile(userProfile)
            } else if (!session?.user) {
              setProfile(null)
            }

            setLoading(false)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  const needsOnboarding = () => {
    if (!profile) return false
    return profile.role === "pending" || !profile.role
  }

  return {
    user,
    loading,
    isAuthenticated,
    profile,
    profileLoading,
    needsOnboarding,
    fetchUserProfile,
    ...operations,
  }
}
