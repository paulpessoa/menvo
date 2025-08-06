import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create a single Supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Function to handle OAuth sign-in with user type
export const signInWithOAuth = async (provider: 'google' | 'github' | 'linkedin', userType: Database['public']['Enums']['user_role']) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${location.origin}/auth/callback`,
      queryParams: {
        user_type: userType,
      },
    },
  })
  if (error) {
    console.error('OAuth sign-in error:', error)
    throw error
  }
  return data
}

// Function to handle email/password sign-up with user type
export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string, userType: Database['public']['Enums']['user_role']) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        user_type: userType,
      },
      emailRedirectTo: `${location.origin}/auth/callback`,
    },
  })
  if (error) {
    console.error('Email sign-up error:', error)
    throw error
  }
  return data
}

// Function to handle email/password sign-in
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    console.error('Email sign-in error:', error)
    throw error
  }
  return data
}

// Function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Function to get current user session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Get session error:', error)
    throw error
  }
  return session
}

// Function to get current user
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Get user error:', error)
    throw error
  }
  return user
}

// Function to update user profile in public.profiles table
export const updateProfile = async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }
  return data
}

// Function to fetch user profile from public.profiles table
export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw error
  }
  return data
}
