"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { handleAsyncOperation } from "@/lib/error-handler"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/types/supabase"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

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

  const fetchProfile = useCallback(async () => {
    if (!user) return

    const result = await handleAsyncOperation(
      async () => {
        logger.debug('Fetching profile via API', 'useProfile', { userId: user.id });
        
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        logger.debug('Profile fetched successfully via API', 'useProfile', { userId: user.id });
        return data.profile as Profile;
      },
      'fetchProfile'
    );

    setLoading(false);

    if (result.data) {
      setProfile(result.data);
      setError(null);
    } else {
      console.error('❌ Profile fetch failed:', result.error);
      setError(result.error || 'Error fetching profile');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user, fetchProfile])

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
    const optimisticProfile = { ...profile, ...updates } as Profile;
    setProfile(optimisticProfile);

    const result = await handleAsyncOperation(
      async () => {
        logger.info('Updating profile via API', 'useProfile', { 
          userId: user.id, 
          fields: Object.keys(updates) 
        });

        // Call the profile API endpoint
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
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
