'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationsService,
  type InAppNotification
} from '@/lib/services/notifications/notifications.service';

export function useNotifications(userId?: string, role?: string | null) {
  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Carregar IDs lidos do localStorage na montagem
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(`menvo_read_notifications_${userId}`);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error('[useNotifications] Erro ao carregar notificações lidas:', e);
    }
  }, [userId]);

  // Salvar no localStorage sempre que readIds mudar
  const persistReadIds = useCallback(
    (newSet: Set<string>) => {
      if (!userId) return;
      try {
        localStorage.setItem(
          `menvo_read_notifications_${userId}`,
          JSON.stringify(Array.from(newSet))
        );
        setReadIds(newSet);
      } catch (e) {
        console.error('[useNotifications] Erro ao salvar notificações lidas:', e);
      }
    },
    [userId]
  );

  const {
    data: rawNotifications = [],
    isLoading,
    refetch
  } = useQuery<InAppNotification[]>({
    queryKey: ['notifications', userId, role],
    queryFn: async () => {
      if (!userId) return [];
      return notificationsService.getUserNotifications(userId, role);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 // Polling suave a cada 60s
  });

  const notifications = useMemo(() => {
    return rawNotifications.map((notif) => ({
      ...notif,
      isRead: readIds.has(notif.id)
    }));
  }, [rawNotifications, readIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markAsRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;
      const next = new Set(readIds);
      next.add(id);
      persistReadIds(next);
    },
    [readIds, persistReadIds]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = new Set([...Array.from(readIds), ...rawNotifications.map((n) => n.id)]);
    persistReadIds(allIds);
  }, [readIds, rawNotifications, persistReadIds]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch
  };
}
