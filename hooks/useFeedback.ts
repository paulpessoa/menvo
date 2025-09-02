'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function useFeedback() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const submitFeedback = async (feedback: {
    type: string;
    message: string;
    rating?: number;
    page_url?: string;
  }) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          ...feedback,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao enviar feedback:', error);
        toast.error('Erro ao enviar feedback');
        return { feedback: null, error };
      }

      toast.success('Feedback enviado com sucesso');
      return { feedback: data, error: null };
    } catch (error) {
      console.error('Erro inesperado ao enviar feedback:', error);
      toast.error('Erro inesperado ao enviar feedback');
      return { feedback: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async (filters: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('feedback')
        .select('*', { count: 'exact' });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.limit) {
        const from = filters.offset || 0;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar feedback:', error);
        return { feedback: [], count: 0, error };
      }

      return { feedback: data || [], count: count || 0, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar feedback:', error);
      return { feedback: [], count: 0, error };
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackStats = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('type, rating');

      if (error) {
        console.error('Erro ao buscar estatísticas de feedback:', error);
        return { stats: null, error };
      }

      const stats = {
        total: data?.length || 0,
        byType: data?.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        averageRating: data?.filter(item => item.rating)
          .reduce((sum, item, _, arr) => sum + item.rating / arr.length, 0) || 0,
      };

      return { stats, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
      return { stats: null, error };
    }
  };

  return {
    submitFeedback,
    getFeedback,
    getFeedbackStats,
    loading,
  };
}