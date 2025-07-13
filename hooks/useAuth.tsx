"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (data: { email: string; password: string; fullName: string; userType: string }) => Promise<{ error?: any }>
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signInWithGoogle: () => Promise<{ error?: any }>
  signInWithLinkedIn: () => Promise<{ error?: any }>
  signInWithGitHub: () => Promise<{ error?: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({
    email,
    password,
    fullName,
    userType,
  }: { email: string; password: string; fullName: string; userType: string }) => {
    try {
      console.log("🔄 Iniciando signUp:", { email, fullName, userType })

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            first_name: fullName.split(" ")[0] || "",
            last_name: fullName.split(" ").slice(1).join(" ") || "",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("❌ Erro no signUp:", error)
        return { error }
      }

      console.log("✅ SignUp bem-sucedido:", data.user?.id)
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no signUp:", error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔄 Iniciando signIn:", { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        console.error("❌ Erro no signIn:", error)
        return { error }
      }

      console.log("✅ SignIn bem-sucedido:", data.user?.id)
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no signIn:", error)
      return { error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log("🔄 Iniciando Google OAuth")

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
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no Google OAuth:", error)
      return { error }
    }
  }

  const signInWithLinkedIn = async () => {
    try {
      console.log("🔄 Iniciando LinkedIn OAuth")

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
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no LinkedIn OAuth:", error)
      return { error }
    }
  }

  const signInWithGitHub = async () => {
    try {
      console.log("🔄 Iniciando GitHub OAuth")

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
      return { error: null }
    } catch (error) {
      console.error("❌ Erro inesperado no GitHub OAuth:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log("🔄 Iniciando signOut")

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ Erro no signOut:", error)
        throw error
      }

      console.log("✅ SignOut bem-sucedido")
    } catch (error) {
      console.error("❌ Erro inesperado no signOut:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithGitHub,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Manter compatibilidade com código existente
export { useAuth } from "@/app/context/auth-context"
