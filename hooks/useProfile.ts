"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { handleAsyncOperation, createAppError } from "@/lib/error-handler"
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
  current_position: string | null
  current_company: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  personal_website_url: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  expertise_areas: string[] | null
  topics: string[] | null
  inclusion_tags: string[] | null
  languages: string[] | null
  mentorship_approach: string | null
  what_to_expect: string | null
  ideal_mentee: string | null
  cv_url: string | null
  role: string | null
  status: string | null
  verification_status: string | null
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

    if (result.success) {
      setProfile(result.data!);
      setError(null);
    } else {
      setError(result.error?.message || 'Error fetching profile');
    }
  }

  const createProfile = async (): Promise<Profile> => {
    if (!user) throw new Error('No user found');

    logger.info('Creating new profile', 'useProfile', { userId: user.id });

    const profileData = {
      id: user.id,
      email: user.email || "",
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      full_name: user.user_metadata?.full_name || "",
      role: user.user_metadata?.user_type || "mentee",
      status: "pending",
      verification_status: "pending",
    };

    const { data, error: createError } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single()

    if (createError) {
      logger.error('Failed to create profile', 'useProfile', { 
        userId: user.id, 
        error: createError,
        profileData 
      });
      throw createError;
    }

    logger.info('Profile created successfully', 'useProfile', { userId: user.id });
    return data;
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
        logger.info('Updating profile', 'useProfile', { 
          userId: user.id, 
          fields: Object.keys(updates) 
        });

        const updateData = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const { data, error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id)
          .select()
          .single()

        if (updateError) {
          logger.error('Profile update failed', 'useProfile', { 
            userId: user.id, 
            error: updateError,
            updateData 
          });
          throw updateError;
        }

        logger.profileUpdate(true, user.id, Object.keys(updates));
        return data;
      },
      'updateProfile'
    );

    setIsUpdating(false);

    if (result.success) {
      setProfile(result.data!);
      setError(null);
      return { success: true, data: result.data };
    } else {
      // Revert optimistic update
      setProfile(previousProfile);
      const errorMessage = result.error?.message || 'Error updating profile';
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
