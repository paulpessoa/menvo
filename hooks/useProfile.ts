"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import { handleAsyncOperation } from "@/lib/error-handler"
import { logger } from "@/lib/logger"

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  slug: string | null
  bio: string | null
  avatar_url: string | null
  
  // Professional fields (mapped from database)
  job_title: string | null // maps to current_position in form
  company: string | null // maps to current_company in form
  linkedin_url: string | null
  github_url: string | null
  twitter_url: string | null
  website_url: string | null // maps to personal_website_url in form
  phone: string | null
  
  // Location fields
  city: string | null
  state: string | null
  country: string | null
  timezone: string | null
  age: number | null
  
  // Mentorship fields
  expertise_areas: string[] | null
  mentorship_topics: string[] | null // maps to topics in form
  inclusive_tags: string[] | null // maps to inclusion_tags in form
  languages: string[] | null
  
  // Additional fields that need to be added to database
  address: string | null // needs migration
  portfolio_url: string | null // needs migration  
  mentorship_approach: string | null // needs migration
  what_to_expect: string | null // needs migration
  ideal_mentee: string | null // needs migration
  cv_url: string | null
  
  // System fields
  verified: boolean
  experience_years: number | null
  session_price_usd: number | null
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdateResult {
  success: boolean;
  data?: Profile;
  error?: string;
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    console.log('🔍 Starting fetchProfile for user:', user.id);
    const supabase = createClient()
    
    const result = await handleAsyncOperation(
      async () => {
        logger.debug('Fetching profile', 'useProfile', { userId: user.id });
        
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // Profile doesn't exist, create it
            logger.info('Profile not found, creating new profile', 'useProfile', { userId: user.id });
            return await createProfile()
          } else {
            throw fetchError
          }
        }

        logger.debug('Profile fetched successfully', 'useProfile', { userId: user.id });
        return data;
      },
      'fetchProfile'
    );

    setLoading(false);
    console.log('📋 fetchProfile result:', result);

    if (result.data) {
      setProfile(result.data);
      setError(null);
      console.log('✅ Profile loaded successfully');
    } else {
      console.error('❌ Profile fetch failed:', result.error);
      setError(result.error || 'Error fetching profile');
    }
  }

  const createProfile = async (): Promise<Profile> => {
    if (!user) throw new Error('No user found');

    logger.info('Creating new profile via API', 'useProfile', { userId: user.id });

    // Get session for API call
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No session found for profile creation')
    }

    // Use the profile API to create the profile (it handles creation automatically)
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Profile creation failed' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    logger.info('Profile created successfully via API', 'useProfile', { userId: user.id });
    return result.profile;
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<ProfileUpdateResult> => {
    if (!user) {
      const error = 'No user found';
      logger.error(error, 'useProfile');
      return { success: false, error };
    }

    if (!profile) {
      const error = 'No profile found';
      logger.error(error, 'useProfile', { userId: user.id });
      return { success: false, error };
    }

    // Validate required fields
    if (updates.first_name !== undefined && !updates.first_name?.trim()) {
      const error = 'Nome é obrigatório';
      return { success: false, error };
    }

    if (updates.last_name !== undefined && !updates.last_name?.trim()) {
      const error = 'Sobrenome é obrigatório';
      return { success: false, error };
    }

    setIsUpdating(true);
    setError(null);

    // Optimistic update
    const previousProfile = profile;
    const optimisticProfile = { ...profile, ...updates };
    setProfile(optimisticProfile);

    const result = await handleAsyncOperation(
      async () => {
        logger.info('Updating profile via API', 'useProfile', { 
          userId: user.id, 
          fields: Object.keys(updates) 
        });

        // Get session for API call
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          throw new Error('Sessão expirada. Faça login novamente.')
        }

        // Call the profile API endpoint
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Profile update failed' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        logger.profileUpdate(true, user.id, Object.keys(updates));
        return result.profile;
      },
      'updateProfile'
    );

    setIsUpdating(false);

    if (result.success && result.data) {
      setProfile(result.data);
      setError(null);
      return { success: true, data: result.data };
    } else {
      // Revert optimistic update
      setProfile(previousProfile);
      const errorMessage = result.error || 'Error updating profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  return {
    profile,
    loading,
    error,
    isUpdating,
    updateProfile,
    refetch: fetchProfile,
  }
}
