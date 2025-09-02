import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/auth/supabase'
import { useUser } from './useUser'

export function useFullUserProfile() {
  return useQuery({
    queryKey: ['full-user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Erro ao buscar perfil completo')
      return res.json()
    }
  })
}

interface SaveProfileInput {
  id: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  current_position?: string
  current_company?: string
}

const userFields: (keyof SaveProfileInput)[] = ['first_name', 'last_name', 'phone', 'avatar_url']
const profileFields: (keyof SaveProfileInput)[] = ['bio', 'location', 'linkedin_url', 'github_url', 'current_position', 'current_company']

export function useSaveFullUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SaveProfileInput) => {
      const userUpdate: Partial<SaveProfileInput> = {}
      const profileUpdate: Partial<SaveProfileInput> = {}

      for (const key of userFields) {
        if (data[key] !== undefined) userUpdate[key] = data[key]
      }
      for (const key of profileFields) {
        if (data[key] !== undefined) profileUpdate[key] = data[key]
      }

      if (Object.keys(userUpdate).length > 0) {
        const { error } = await supabase.from('users').update(userUpdate).eq('id', data.id)
        if (error) throw error
      }

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabase.from('user_profiles').update(profileUpdate).eq('user_id', data.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['full-user-profile'] })
    }
  })
}
