import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  mentorAvailabilityService, 
  mentorshipSessionsService,
  type MentorAvailability,
  type SessionRequest,
  type SessionResponse
} from '@/services/mentorship/mentorship'
import { toast } from 'sonner'

// =============================================
// MENTOR AVAILABILITY HOOKS
// =============================================

export const useMentorAvailability = (mentorId: string) => {
  return useQuery({
    queryKey: ['mentor-availability', mentorId],
    queryFn: () => mentorAvailabilityService.getMentorAvailability(mentorId),
    enabled: !!mentorId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useAddAvailability = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mentorAvailabilityService.addAvailability,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-availability', data.mentor_id] })
      toast.success('Horário adicionado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar horário')
    }
  })
}

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<MentorAvailability> }) =>
      mentorAvailabilityService.updateAvailability(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-availability', data.mentor_id] })
      toast.success('Horário atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar horário')
    }
  })
}

export const useRemoveAvailability = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mentorAvailabilityService.removeAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-availability'] })
      toast.success('Horário removido com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover horário')
    }
  })
}

export const useSetMentorAvailability = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ mentorId, availabilities }: { 
      mentorId: string, 
      availabilities: Omit<MentorAvailability, 'id' | 'mentor_id' | 'created_at' | 'updated_at'>[] 
    }) => mentorAvailabilityService.setMentorAvailability(mentorId, availabilities),
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['mentor-availability', data[0].mentor_id] })
      }
      toast.success('Disponibilidade atualizada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar disponibilidade')
    }
  })
}

// =============================================
// MENTORSHIP SESSIONS HOOKS
// =============================================

export const useRequestSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mentorshipSessionsService.requestSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-sessions'] })
      toast.success('Solicitação de mentoria enviada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao solicitar mentoria')
    }
  })
}

export const useRespondToSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mentorshipSessionsService.respondToSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['mentorship-session', data.id] })
      const message = data.status === 'confirmed' 
        ? 'Sessão confirmada com sucesso!' 
        : 'Sessão rejeitada'
      toast.success(message)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao responder solicitação')
    }
  })
}

export const useMentorSessions = (mentorId?: string, status?: string) => {
  return useQuery({
    queryKey: ['mentorship-sessions', 'mentor', mentorId, status],
    queryFn: () => mentorshipSessionsService.getMentorSessions(mentorId, status),
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const useMenteeSessions = (menteeId?: string, status?: string) => {
  return useQuery({
    queryKey: ['mentorship-sessions', 'mentee', menteeId, status],
    queryFn: () => mentorshipSessionsService.getMenteeSessions(menteeId, status),
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const useCompleteSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sessionId, mentorNotes }: { sessionId: string, mentorNotes?: string }) =>
      mentorshipSessionsService.completeSession(sessionId, mentorNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-sessions'] })
      toast.success('Sessão marcada como completa!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao completar sessão')
    }
  })
}

export const useCancelSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string, reason?: string }) =>
      mentorshipSessionsService.cancelSession(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-sessions'] })
      toast.success('Sessão cancelada')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cancelar sessão')
    }
  })
}

export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['mentorship-session', sessionId],
    queryFn: () => mentorshipSessionsService.getSession(sessionId),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useMentorStats = (mentorId: string) => {
  return useQuery({
    queryKey: ['mentor-stats', mentorId],
    queryFn: () => mentorshipSessionsService.getMentorStats(mentorId),
    enabled: !!mentorId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

// =============================================
// HOOKS COMBINADOS
// =============================================

// Hook para obter todas as sessões pendentes do mentor
export const usePendingMentorSessions = (mentorId?: string) => {
  return useMentorSessions(mentorId, 'pending')
}

// Hook para obter todas as sessões confirmadas do mentor
export const useConfirmedMentorSessions = (mentorId?: string) => {
  return useMentorSessions(mentorId, 'confirmed')
}

// Hook para obter todas as sessões do mentorado
export const useMyMenteeSessions = () => {
  return useMenteeSessions()
}

// Hook para obter sessões pendentes do mentorado
export const usePendingMenteeSessions = () => {
  return useMenteeSessions(undefined, 'pending')
}

// Hook para verificar se mentor tem sessões pendentes
export const useHasPendingSessions = (mentorId?: string) => {
  const { data: sessions } = usePendingMentorSessions(mentorId)
  return {
    hasPending: (sessions?.length || 0) > 0,
    pendingCount: sessions?.length || 0
  }
} 