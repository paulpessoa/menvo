import { useQuery, useQueryClient } from '@tanstack/react-query'
import { mentorService, type MentorFilters, type MentorProfile, type PaginatedMentors, type FilterOptions } from '@/services/mentors/mentors'

// Hook para buscar mentores com filtros e paginação
export const useMentors = (filters: MentorFilters = {}) => {
  return useQuery<PaginatedMentors, Error>({
    queryKey: ['mentors', filters],
    queryFn: () => mentorService.getMentors(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: (previousData) => previousData, // Manter dados anteriores durante carregamento
  })
}

// Hook para buscar opções de filtros
export const useFilterOptions = () => {
  return useQuery<FilterOptions, Error>({
    queryKey: ['mentor-filter-options'],
    queryFn: () => mentorService.getFilterOptions(),
    staleTime: 1000 * 60 * 30, // 30 minutos (os filtros mudam menos frequentemente)
  })
}

// Hook para buscar um mentor específico
export const useMentor = (id: string) => {
  return useQuery<MentorProfile | null, Error>({
    queryKey: ['mentor', id],
    queryFn: () => mentorService.getMentorById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

// Hook para invalidar cache de mentores (útil para refresh)
export const useRefreshMentors = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['mentors'] })
    queryClient.invalidateQueries({ queryKey: ['mentor-filter-options'] })
  }
} 