import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper function to get site URL
const getSiteUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    console.log("🔄 Supabase signUp iniciado:", { email })

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: metadata || {},
      },
    })

    if (error) {
      console.error("❌ Erro no Supabase signUp:", error)
      throw error
    }

    console.log("✅ Supabase signUp bem-sucedido:", data.user?.id)
    return data
  },

  signIn: async (email: string, password: string) => {
    console.log("🔄 Supabase signIn iniciado:", { email })

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      console.error("❌ Erro no Supabase signIn:", error)
      throw error
    }

    console.log("✅ Supabase signIn bem-sucedido:", data.user?.id)
    return data
  },

  signInWithGoogle: async () => {
    console.log("🔄 Google OAuth iniciado")

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
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

    console.log("✅ Google OAuth iniciado com sucesso")
    return data
  },

  signInWithLinkedIn: async () => {
    console.log("🔄 LinkedIn OAuth iniciado")

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
        queryParams: {
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.error("❌ Erro no LinkedIn OAuth:", error)
      throw error
    }

    console.log("✅ LinkedIn OAuth iniciado com sucesso")
    return data
  },

  signInWithGitHub: async () => {
    console.log("🔄 GitHub OAuth iniciado")

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
        queryParams: {
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.error("❌ Erro no GitHub OAuth:", error)
      throw error
    }

    console.log("✅ GitHub OAuth iniciado com sucesso")
    return data
  },

  signOut: async () => {
    console.log("🔄 SignOut iniciado")

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no signOut:", error)
      throw error
    }

    console.log("✅ SignOut bem-sucedido")
  },

  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("❌ Erro ao obter usuário:", error)
      throw error
    }

    return user
  },

  resendConfirmationEmail: async (email: string) => {
    console.log("🔄 Reenviando email de confirmação:", { email })

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    })

    if (error) {
      console.error("❌ Erro ao reenviar email:", error)
      throw error
    }

    console.log("✅ Email de confirmação reenviado")
  },

  resetPassword: async (email: string) => {
    console.log("🔄 Iniciando reset de senha:", { email })

    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${getSiteUrl()}/reset-password`,
    })

    if (error) {
      console.error("❌ Erro no reset de senha:", error)
      throw error
    }

    console.log("✅ Email de reset enviado")
  },

  updatePassword: async (newPassword: string) => {
    console.log("🔄 Atualizando senha")

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("❌ Erro ao atualizar senha:", error)
      throw error
    }

    console.log("✅ Senha atualizada")
  },
}
