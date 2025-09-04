'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { getPostLoginRedirect, determineRedirect, isProfileComplete } from '@/lib/auth-redirect';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        toast.error('Erro ao fazer logout');
        return { success: false, error };
      }
      
      toast.success('Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      toast.error('Erro inesperado no logout');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, intendedDestination?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(error.message);
        }
        
        return { success: false, error };
      }

      if (!data.user) {
        toast.error('Falha no login');
        return { success: false, error: new Error('No user returned') };
      }

      // Get user profile to determine redirect
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role, verification_status, full_name, bio, current_position, mentor_skills')
          .eq('id', data.user.id)
          .single();

        const redirectPath = getPostLoginRedirect(
          profile?.user_role || null,
          profile?.verification_status,
          profile,
          intendedDestination
        );

        toast.success('Login realizado com sucesso!');
        
        // Redirect after a short delay to allow toast to show
        setTimeout(() => {
          router.push(redirectPath);
        }, 500);

        return { success: true, data, redirectPath };
      } catch (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        // Fallback redirect
        setTimeout(() => {
          router.push('/auth/select-role');
        }, 500);
        
        toast.success('Login realizado com sucesso!');
        return { success: true, data, redirectPath: '/auth/select-role' };
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast.error('Erro interno do servidor');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao obter usuário:', error);
        return { user: null, profile: null, error };
      }

      if (!user) {
        return { user: null, profile: null, authenticated: false };
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        user,
        profile: profile || null,
        authenticated: true,
        profileError: profileError?.message || null
      };
    } catch (error) {
      console.error('Erro inesperado ao obter usuário:', error);
      return { user: null, profile: null, error };
    }
  };

  return {
    signOut,
    signIn,
    getCurrentUser,
    loading,
  };
}