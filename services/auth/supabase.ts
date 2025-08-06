import { createClient } from '@/utils/supabase/client';
import { user_role } from '@/types/database'; // Import the user_role type

const supabase = createClient();

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  return { data, error };
};

export const signInWithOAuth = async (provider: 'google' | 'github' | 'linkedin') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPasswordForEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  return { error };
};

export const updateUserPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password });
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Partial<{
  full_name: string;
  username: string;
  avatar_url: string;
  website: string;
  bio: string;
  location: string;
  occupation: string;
  skills: string[];
  interests: string[];
  role: user_role;
  is_profile_complete: boolean;
  slug: string;
}>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const getAdminUsers = async () => {
  // This function should ideally be called from a server component or API route
  // using the service role key for security, or with RLS policies for admins.
  // For client-side, ensure RLS is configured to allow admins to view other users.
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');
  return { data, error };
};

export const updateAdminUser = async (userId: string, updates: Partial<{
  full_name?: string;
  username?: string;
  avatar_url?: string;
  website?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  skills?: string[];
  interests?: string[];
  role?: user_role;
  is_profile_complete?: boolean;
  slug?: string;
}>) => {
  // This function should ideally be called from a server component or API route
  // using the service role key for security.
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};
