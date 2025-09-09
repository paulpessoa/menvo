'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function useProfiles() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const getProfile = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return { profile: null, error };
      }

      return { profile: data, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      return { profile: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, updates: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        toast.error('Erro ao atualizar perfil');
        return { profile: null, error };
      }

      toast.success('Perfil atualizado com sucesso');
      return { profile: data, error: null };
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error);
      toast.error('Erro inesperado ao atualizar perfil');
      return { profile: null, error };
    } finally {
      setLoading(false);
    }
  };

  const listProfiles = async (filters: {
    start?: number;
    end?: number;
    role?: string;
    search?: string;
  } = {}) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (filters.role) {
        query = query.eq('user_role', filters.role);
      }

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,` +
          `last_name.ilike.%${filters.search}%,` +
          `full_name.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%`
        );
      }

      if (filters.start !== undefined && filters.end !== undefined) {
        query = query.range(filters.start, filters.end);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao listar perfis:', error);
        return { profiles: [], count: 0, error };
      }

      return { profiles: data || [], count: count || 0, error: null };
    } catch (error) {
      console.error('Erro inesperado ao listar perfis:', error);
      return { profiles: [], count: 0, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    getProfile,
    updateProfile,
    listProfiles,
    loading,
  };
}
