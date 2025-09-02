import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { useToast } from './useToast'
import { UserType } from '@/hooks/useSignupForm'

interface UpdateRoleData {
  role: UserType
}

// Função para atualizar role no JWT via API
const updateUserRole = async (data: UpdateRoleData) => {
  const response = await fetch('/api/auth/update-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: data.role }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Erro ao atualizar role')
  }

  return response.json()
}

export function useRoleSelection() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: (data, variables) => {
      toast({
        title: "Sucesso",
        description: "Tipo de usuário definido com sucesso!",
      })

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões. Tente novamente.",
        variant: "destructive",
      })
    }
  })

  const updateRole = (role: UserType) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      })
      return
    }

    mutation.mutate({ role })
  }

  return {
    updateRole,
    isUpdating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error
  }
}
