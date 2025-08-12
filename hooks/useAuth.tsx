"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

// Hook para operações de autenticação
export const useAuthOperations = () => {
  const getSupabaseClient = () => {
    try {
      return createClient()
    } catch (error) {
      console.error("Erro ao criar cliente Supabase:", error)
      throw error
    }
  }

  const signUp = async ({
    email,
    password,
    fullName,
    userType,
  }: { email: string; password: string; fullName: string; userType: string }) => {
    try {
      console.log("🔄 Iniciando signUp:", { email, fullName, userType })

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          fullName,
          userType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Erro no signUp:", data.error)
        return { error: data.error }
      }

      console.log("✅ SignUp bem-sucedido:", data.user?.id)
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no signUp:", error)
      return { error: "Erro inesperado" }
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
        return { error }
      }

      console.log("✅ SignIn bem-sucedido:", data.user?.id)
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no signIn:", error)
      return { error }
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
        return { error }
      }

      console.log("✅ Google OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no Google OAuth:", error)
      return { error }
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
        return { error }
      }

      console.log("✅ LinkedIn OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no LinkedIn OAuth:", error)
      return { error }
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
        return { error }
      }

      console.log("✅ GitHub OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no GitHub OAuth:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log("🔄 Iniciando signOut")

      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ Erro no signOut:", error)
        return { error }
      }

      console.log("✅ SignOut bem-sucedido")
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no signOut:", error)
      return { error }
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

  const operations = useAuthOperations()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const supabase = createClient()

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

  return {
    user,
    loading,
    isAuthenticated,
    ...operations,
  }
}
