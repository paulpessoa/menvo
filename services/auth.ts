import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: "mentee" | "mentor"
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  // Cadastro com email e senha
  static async signUp(data: SignUpData) {
    const { email, password, firstName, lastName, userType } = data

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          user_type: userType,
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) throw error
    return authData
  }

  // Login com email e senha
  static async signIn(data: SignInData) {
    const { email, password } = data

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return authData
  }

  // Login com Google
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  }


  // Logout
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Recuperar senha
  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
    return data
  }

  // Atualizar senha
  static async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    if (error) throw error
    return data
  }

  // Obter usuário atual
  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  // Atualizar perfil do usuário
  static async updateProfile(updates: {
    full_name?: string
    avatar_url?: string
    [key: string]: any
  }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })

    if (error) throw error
    return data
  }
}
