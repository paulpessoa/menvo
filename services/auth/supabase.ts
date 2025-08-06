import { createClient } from "@supabase/supabase-js"
import { UserType } from '@/hooks/useSignupForm'
import type { Provider } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper function to get the appropriate callback URL
const getCallbackUrl = () => {
  // In production, use the Supabase callback URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_OAUTH_CALLBACK_URL || `${supabaseUrl}/auth/v1/callback`
  }
  // In development, use the local callback URL
  return process.env.NEXT_PUBLIC_LOCAL_CALLBACK_URL || `${window.location.origin}/auth/callback`
}

// Helper function to get site URL
const getSiteUrl = () => {
  // Para rotas internas, sempre use o origin atual
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Fallback para server-side (se necessário)
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          email_confirmed: false
        }
      }
    })
    if (error) throw error
    return data
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // OAuth sign-in methods
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getCallbackUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
    return data
  },

  signInWithLinkedIn: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: getCallbackUrl(),
        skipBrowserRedirect: false,
        queryParams: {
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
    return data
  },

  // Método alternativo para LinkedIn (caso o principal falhe)
  signInWithLinkedInAlt: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: getCallbackUrl(),
          scopes: 'openid profile email',
        },
      })
      if (error) throw error
      return data
    } catch (err) {
      console.error('LinkedIn OAuth error:', err)
      throw err
    }
  },

  signInWithGitHub: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getCallbackUrl(),
        queryParams: {
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
    return data
  },

  signInWithOAuth: async (provider: Provider, userType: 'mentor' | 'mentee') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        // Pass user type to the handle_new_user trigger
        data: {
          user_type: userType
        }
      },
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getUser: async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Função para reenviar email de confirmação
  resendConfirmationEmail: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`
      }
    })
    if (error) throw error
  },

  // Funções de recuperação de senha
  resetPassword: async (email: string) => {
    console.log('🔄 Iniciando reset password para:', email)
    console.log('🌐 Site URL:', getSiteUrl())
    console.log('🔗 Redirect URL:', `${getSiteUrl()}/reset-password`)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/reset-password`,
    })
    
    if (error) {
      console.error('❌ Erro no reset password:', error)
      throw error
    }
    
    console.log('✅ Reset password enviado com sucesso!')
    console.log('📧 Verifique sua caixa de entrada e pasta de spam')
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }
}

export const addUserToDatabase = async (email: string, userId: string, userType: UserType, firstName: string, lastName: string) => {
    const { data, error } = await supabase
        .from('users')
        .insert([{ 
            email, 
            id: userId, 
            user_type: userType, 
            first_name: firstName, 
            last_name: lastName,
            status: 'pending'
        }]);

    if (error) throw error;
    return data;
};
