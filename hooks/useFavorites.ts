'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/utils/supabase/client';
import { toast } from 'sonner';

export function useFavorites(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: favorites = [], isLoading: loading } = useQuery<string[]>({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_favorites')
        .select('mentor_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data as { mentor_id: string }[])?.map(f => f.mentor_id) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache fresco
  });

  const mutation = useMutation({
    mutationFn: async ({ mentorId, isFavorite }: { mentorId: string; isFavorite: boolean }) => {
      if (!userId) throw new Error('Não autenticado');

      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('mentor_id', mentorId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: userId, mentor_id: mentorId } as any);
        if (error) throw error;
      }
      return { mentorId, isFavorite };
    },
    onMutate: async ({ mentorId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites', userId]) || [];

      // Optimistic update para feedback instantâneo
      const updatedFavorites = isFavorite
        ? previousFavorites.filter(id => id !== mentorId)
        : [...previousFavorites, mentorId];

      queryClient.setQueryData(['favorites', userId], updatedFavorites);
      return { previousFavorites };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }
      toast.error('Erro ao atualizar favoritos');
    },
    onSuccess: (_, { isFavorite }) => {
      toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    }
  });

  const toggleFavorite = async (mentorId: string) => {
    if (!userId) {
      toast.error('Faça login para salvar favoritos');
      return;
    }
    const isFavorite = favorites.includes(mentorId);
    await mutation.mutateAsync({ mentorId, isFavorite });
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    refreshFavorites: () => queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
  };
}
