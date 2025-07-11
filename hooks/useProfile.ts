import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProfile(userId?: string) {
  // Busca perfil e roles do usuário logado
  const query = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/profiles/me')
      if (!res.ok) throw new Error('Erro ao buscar perfil')
      return res.json()
    },
    enabled: !!userId, // Só busca se userId estiver presente
  })

  // Atualiza perfil
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao atualizar perfil')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    },
  })

  // Helper para upload de foto no Supabase Storage
  async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    // Você pode criar um endpoint /api/upload/profile-photo para lidar com o upload no backend
    const res = await fetch(`/api/upload/profile-photo?userId=${userId}`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Erro ao fazer upload da foto')
    const { url } = await res.json()
    return url // URL pública da foto
  }

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    uploadProfilePhoto,
  }
}
