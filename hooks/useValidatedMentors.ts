import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/services/auth/auth.service'
import type { MentorProfile } from '@/lib/types/models/mentor'

export function useValidatedMentors() {
  return useQuery({
    queryKey: ['validatedMentors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('verified', true)
        .returns<MentorProfile[]>()
      
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
