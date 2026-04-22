import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Supabase tipado globalmente
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to get site URL
const getSiteUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

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
    if (error) throw error
    return data
  },
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.toLowerCase().trim(), 
      password 
    })
    if (error) throw error
    return data
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },
  resendConfirmationEmail: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`
      }
    })
    if (error) throw error
  }
}
