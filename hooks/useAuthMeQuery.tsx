import { useQuery } from '@tanstack/react-query'

export function useAuthMeQuery(userId?: string | null) {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      // Get the session from localStorage
      const session = localStorage.getItem('supabase.auth.token')
      const token = session ? JSON.parse(session).currentSession?.access_token : null

      const res = await fetch('/api/auth/me', { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) return { user: null }
      return res.json()
    },
    enabled: !!userId
  })
}
