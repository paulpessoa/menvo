'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client'; // Corrected import path
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { user_role } from '@/types/database'; // Import the user_role type

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMentor: boolean;
  isMentee: boolean;
  userRole: user_role | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<user_role | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const fetchUserAndProfile = useCallback(async () => {
    setIsLoading(true);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Error fetching auth user:', authError);
      setUser(null);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    setUser(authUser);

    if (authUser) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUserRole(null);
      } else if (profile) {
        setUserRole(profile.role);
      }
    } else {
      setUserRole(null);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        fetchUserAndProfile();
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [fetchUserAndProfile, supabase.auth]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setUser(null);
      setUserRole(null);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/login');
    }
    setIsLoading(false);
  }, [supabase.auth, router, toast]);

  const refreshUser = useCallback(async () => {
    await fetchUserAndProfile();
  }, [fetchUserAndProfile]);

  const isAuthenticated = !!user;
  const isAdmin = userRole === 'admin';
  const isMentor = userRole === 'mentor';
  isMentee = userRole === 'mentee';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isMentor,
        isMentee,
        userRole,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
