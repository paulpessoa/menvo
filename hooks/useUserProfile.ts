import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/auth/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database'

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  mentor: Database['public']['Tables']['mentors']['Row'] | null
}

export const useUserProfile = () => {
  const { user, isLoading: isAuthLoading } = useAuth()

  return useQuery<Profile | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          mentor:mentors(*)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      // The select query for mentor returns an array, but it should be an object or null
      const formattedData = {
        ...data,
        mentor: Array.isArray(data.mentor) ? data.mentor[0] || null : data.mentor,
      }

      return formattedData
    },
    enabled: !isAuthLoading && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
