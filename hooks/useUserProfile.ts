import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/types/database'; // Assuming you have a UserProfile type

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUserProfile = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      console.error('Error fetching user profile:', dbError);
      setError(dbError.message);
      setProfile(null);
    } else if (data) {
      setProfile(data);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    } else {
      // If no userId is provided, try to fetch the current authenticated user's profile
      const getAuthenticatedUser = async () => {
        setIsLoading(true);
        setError(null);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('No authenticated user or error fetching user:', authError);
          setError(authError?.message || 'No authenticated user.');
          setProfile(null);
          setIsLoading(false);
          return;
        }
        fetchUserProfile(user.id);
      };
      getAuthenticatedUser();
    }
  }, [userId, fetchUserProfile, supabase.auth]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    if (!profile?.id) {
      setError('No profile ID available for update.');
      setIsLoading(false);
      return null;
    }

    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      setError(updateError.message);
      setIsLoading(false);
      return null;
    }

    if (data) {
      setProfile(data);
    }
    setIsLoading(false);
    return data;
  }, [profile?.id, supabase]);

  return { profile, isLoading, error, updateProfile, refreshProfile: fetchUserProfile };
};
