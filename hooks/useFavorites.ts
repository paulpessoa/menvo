'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { toast } from 'sonner';

export function useFavorites(userId?: string) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('mentor_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites((data as any[])?.map(f => f.mentor_id) || []);
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (mentorId: string) => {
    if (!userId) {
      toast.error('Faça login para salvar favoritos');
      return;
    }

    const isFavorite = favorites.includes(mentorId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('mentor_id', mentorId);
        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== mentorId));
        toast.success('Removido dos favoritos');
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: userId, mentor_id: mentorId } as any);
        if (error) throw error;
        setFavorites(prev => [...prev, mentorId]);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    refreshFavorites: fetchFavorites
  };
}
