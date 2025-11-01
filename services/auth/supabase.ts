import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper function to get site URL
const getSiteUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

let _supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Supabase environment variables are missing:")
      console.error("- NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
      console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey)
      throw new Error(
        "Supabase URL and Anon Key are required. Please check your environment variables."
      )
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof typeof client]
  }
})

export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: metadata || {}
      }
    })

    if (error) {
      console.error("❌ Erro no Supabase signUp:", error)
      throw error
    }

    return data
  },

  signIn: async (email: string, password: string) => {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error) {
      console.error("❌ Erro no Supabase signIn:", error)
      throw error
    }

    return data
  },

  signInWithGoogle: async () => {

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }
    })

    if (error) {
      console.error("❌ Erro no Google OAuth:", error)
      throw error
    }

    return data
  },

  signInWithLinkedIn: async () => {

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
        queryParams: {
          prompt: "consent"
        }
      }
    })

    if (error) {
      console.error("❌ Erro no LinkedIn OAuth:", error)
      throw error
    }

    return data
  },

  signOut: async () => {

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no signOut:", error)
      throw error
    }

  },

  getUser: async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      console.error("❌ Erro ao obter usuário:", error)
      throw error
    }

    return user
  },

  resendConfirmationEmail: async (email: string) => {

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`
      }
    })

    if (error) {
      console.error("❌ Erro ao reenviar email:", error)
      throw error
    }

  },

  resetPassword: async (email: string) => {

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${getSiteUrl()}/reset-password`
      }
    )

    if (error) {
      console.error("❌ Erro no reset de senha:", error)
      throw error
    }
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error("❌ Erro ao atualizar senha:", error)
      throw error
    }
  }
}
