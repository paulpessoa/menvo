'use client';

import { useState } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { toast } from 'sonner';

export function useFeedback() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const submitFeedback = async (data: {
    type: string;
    message: string;
    rating?: number;
    user_id?: string | null;
    page_url?: string;
  }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: data.user_id || null,
          type: data.type,
          message: data.message,
          rating: data.rating || 0,
          page_url: data.page_url || window.location.pathname,
          created_at: new Date().toISOString(),
        } as any);

      if (error) throw error;

      toast.success('Feedback enviado com sucesso!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async (filters?: any) => {
    setLoading(true);
    try {
      let query = supabase.from('feedback').select('*').order('created_at', { ascending: false });
      
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.rating) query = query.eq('rating', filters.rating);

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackStats = async () => {
    try {
      const { data, error } = await supabase.from('feedback').select('type, rating');
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: (data || []).reduce((acc: any, item: any) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {}),
        averageRating: (data || []).filter((item: any) => item.rating).length > 0
          ? (data || []).reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / (data || []).length
          : 0,
      };

      return { stats, error: null };
    } catch (error) {
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
