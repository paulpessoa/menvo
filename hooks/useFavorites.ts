'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '@/lib/services/favorites/favorites.service';
import { effects, runEffects } from '@/lib/query/effects';
import { qk } from '@/lib/query/keys';
import { toast } from 'sonner';

export function useFavorites(userId?: string) {
  const queryClient = useQueryClient();
  const favoritesKey = qk.me.favorites(userId ?? '');

  const { data: favorites = [], isLoading: loading } = useQuery<string[]>({
    queryKey: favoritesKey,
    queryFn: async () => {
      if (!userId) return [];
      return favoritesService.getFavorites(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache fresco
  });

  const mutation = useMutation({
    mutationFn: async ({ mentorId, isFavorite }: { mentorId: string; isFavorite: boolean }) => {
      if (!userId) throw new Error('Não autenticado');
      await favoritesService.toggleFavorite(userId, mentorId, isFavorite);
      return { mentorId, isFavorite };
    },
    onMutate: async ({ mentorId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey });
      const previousFavorites = queryClient.getQueryData<string[]>(favoritesKey) || [];

      // Optimistic update para feedback instantâneo
      const updatedFavorites = isFavorite
        ? previousFavorites.filter(id => id !== mentorId)
        : [...previousFavorites, mentorId];

      queryClient.setQueryData(favoritesKey, updatedFavorites);
      return { previousFavorites };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesKey, context.previousFavorites);
      }
      toast.error('Erro ao atualizar favoritos');
    },
    onSuccess: (_, { isFavorite }) => {
      toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    },
    onSettled: () => {
      if (userId) return runEffects(queryClient, effects['me.favorites.toggle']({ userId }));
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
    refreshFavorites: () => queryClient.invalidateQueries({ queryKey: favoritesKey })
  };
}
