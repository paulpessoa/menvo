"use client"

import { createClient } from "@/utils/supabase/client"
import { useAuth as useAuthContext } from "@/app/context/auth-context"

// Hook para operações de autenticação
export const useAuthOperations = () => {
  const supabase = createClient()

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

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithGitHub,
  }
}

// Para compatibilidade com código existente, criar um hook simples
export const useAuth = () => {
  // Este hook deve ser usado apenas para operações, não para estado
  // Para estado de autenticação, use o contexto diretamente
  return useAuthContext()
}
