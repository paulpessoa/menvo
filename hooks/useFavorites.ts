'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function useFavorites(userId: string | null | undefined) {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchFavorites = useCallback(async () => {
        if (!userId) {
            setFavorites([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_favorites')
                .select('mentor_id')
                .eq('user_id', userId);

            if (error) throw error;

            setFavorites(data.map(f => f.mentor_id));
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, supabase]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const toggleFavorite = async (mentorId: string) => {
        if (!userId) {
            toast.info("Você precisa estar logado para favoritar mentores");
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
                toast.success("Removido dos favoritos");
            } else {
                const { error } = await supabase
                    .from('user_favorites')
                    .insert({ user_id: userId, mentor_id: mentorId });

                if (error) throw error;
                setFavorites(prev => [...prev, mentorId]);
                toast.success("Adicionado aos favoritos!");
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error("Erro ao processar favorito");
        }
    };

    return { favorites, toggleFavorite, loading, refresh: fetchFavorites };
}
