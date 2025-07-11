import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/auth/supabase'

export function useValidatedMentors() {
  return useQuery({
    queryKey: ['validatedMentors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'mentor')
        .eq('profile_validated', true)
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
