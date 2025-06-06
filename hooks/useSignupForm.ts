import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export type UserType = 'mentee' | 'mentor' | 'company' | 'recruiter'

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: UserType
}

export function useSignupMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ email, password, firstName, lastName, userType }: SignupData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role: userType
        }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao registrar usuário')
      }
      
      return response.json()
    },
    onSuccess: () => {
      router.push('/confirmation')
    }
  })
}