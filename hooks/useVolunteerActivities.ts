'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function useVolunteerActivities() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const getActivities = async (userId?: string, filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('volunteer_activities')
        .select(`
          *,
          activity_type:activity_type_id(*)
        `, { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        const from = filters.offset || 0;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      query = query.order('date', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar atividades:', error);
        return { activities: [], count: 0, error };
      }

      return { activities: data || [], count: count || 0, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar atividades:', error);
      return { activities: [], count: 0, error };
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activity: {
    title: string;
    description?: string;
    hours: number;
    date: string;
    location?: string;
    organization?: string;
    activity_type_id?: string;
    evidence_url?: string;
  }) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return { activity: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('volunteer_activities')
        .insert({
          ...activity,
          user_id: user.id,
          status: 'pending',
        })
        .select(`
          *,
          activity_type:activity_type_id(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar atividade:', error);
        toast.error('Erro ao criar atividade');
        return { activity: null, error };
      }

      toast.success('Atividade criada com sucesso');
      return { activity: data, error: null };
    } catch (error) {
      console.error('Erro inesperado ao criar atividade:', error);
      toast.error('Erro inesperado ao criar atividade');
      return { activity: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = async (id: string, updates: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('volunteer_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          activity_type:activity_type_id(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar atividade:', error);
        toast.error('Erro ao atualizar atividade');
        return { activity: null, error };
      }

      toast.success('Atividade atualizada com sucesso');
      return { activity: data, error: null };
    } catch (error) {
      console.error('Erro inesperado ao atualizar atividade:', error);
      toast.error('Erro inesperado ao atualizar atividade');
      return { activity: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('volunteer_activities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar atividade:', error);
        toast.error('Erro ao deletar atividade');
        return { success: false, error };
      }

      toast.success('Atividade deletada com sucesso');
      return { success: true, error: null };
    } catch (error) {
      console.error('Erro inesperado ao deletar atividade:', error);
      toast.error('Erro inesperado ao deletar atividade');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_activity_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar tipos de atividade:', error);
        return { types: [], error };
      }

      return { types: data || [], error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar tipos:', error);
      return { types: [], error };
    }
  };

  const getActivityStats = async (userId?: string) => {
    try {
      let query = supabase
        .from('volunteer_activities')
        .select('hours, status');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { stats: null, error };
      }

      const stats = {
        totalHours: data?.reduce((sum, activity) => sum + activity.hours, 0) || 0,
        totalActivities: data?.length || 0,
        pendingActivities: data?.filter(a => a.status === 'pending').length || 0,
        validatedActivities: data?.filter(a => a.status === 'validated').length || 0,
        rejectedActivities: data?.filter(a => a.status === 'rejected').length || 0,
      };

      return { stats, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
      return { stats: null, error };
    }
  };

  return {
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivityTypes,
    getActivityStats,
    loading,
  };
}
