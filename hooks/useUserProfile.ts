import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/database'
import { useAuth } from './useAuth'

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  languages: string[] | null
  role: Database['public']['Enums']['user_role']
  status: Database['public']['Enums']['user_status']
  slug: string | null
  profile_completed: boolean
  created_at: string
  updated_at: string
  last_login: string | null
}

export const useUserProfile = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient<Database>()

  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError) {
      console.error('Error fetching user profile:', dbError)
      setError(dbError.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isAuthLoading) {
      fetchUserProfile()
    }
  }, [isAuthLoading, fetchUserProfile])

  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at' | 'last_login' | 'slug'>>) => {
      if (!user) {
        setError('User not authenticated.')
        return null
      }

      setIsLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        setError(updateError.message)
        setIsLoading(false)
        return null
      } else {
        setProfile(data)
        setIsLoading(false)
        return data
      }
    },
    [user, supabase]
  )

  return { profile, isLoading, error, updateProfile, refreshProfile: fetchUserProfile }
}
