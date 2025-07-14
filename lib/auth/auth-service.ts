import { supabase } from "./supabase-client"
import type { SignUpData, CompleteProfileData, User, Profile } from "./types"

export class AuthService {
  static async signUp(data: SignUpData) {
    try {
      const { email, password, firstName, lastName } = data

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Falha ao criar usuário")

      return { user: authData.user, session: authData.session }
    } catch (error: any) {
      throw new Error(error.message || "Erro ao criar conta")
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login")
    }
  }

  static async signInWithGoogle() {
    try {
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

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login com Google")
    }
  }

  static async signInWithLinkedIn() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "openid profile email",
        },
      })

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login com LinkedIn")
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer logout")
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || "Erro ao enviar email de recuperação")
    }
  }

  static async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || "Erro ao atualizar senha")
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      return null
    }
  }

  static async getCurrentProfile(): Promise<Profile | null> {
    try {
      const user = await this.getCurrentUser()
      if (!user) return null

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      return null
    }
  }

  static async completeProfile(data: CompleteProfileData) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          status: "active",
        })
        .eq("id", user.id)

      if (error) throw error

      // Forçar refresh do token para atualizar claims
      await supabase.auth.refreshSession()
    } catch (error: any) {
      throw new Error(error.message || "Erro ao completar perfil")
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }
}
