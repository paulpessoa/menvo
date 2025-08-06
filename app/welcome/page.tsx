'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { updateUserProfile } from '@/services/auth/supabase'
import { Loader2Icon } from 'lucide-react'
import { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading, mutateProfile } = useUserProfile(user?.id)
  const router = useRouter()

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    occupation: '',
    skills: [],
    interests: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !profileLoading && user && userProfile) {
      // If profile is already complete, redirect to dashboard
      if (userProfile.is_profile_complete) {
        router.push('/dashboard')
      } else {
        // Pre-fill with existing data if any
        setFormData({
          full_name: userProfile.full_name || user.user_metadata.full_name || '',
          username: userProfile.username || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          occupation: userProfile.occupation || '',
          skills: userProfile.skills || [],
          interests: userProfile.interests || [],
        })
      }
    }
  }, [user, userProfile, authLoading, profileLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'skills' | 'interests') => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value.split(',').map((item) => item.trim()) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para completar seu perfil.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const updates = {
        ...formData,
        is_profile_complete: true, // Mark profile as complete
      }

      const { error } = await updateUserProfile(user.id, updates)

      if (error) {
        throw error
      }

      mutateProfile() // Trigger re-fetch of profile data
      toast({
        title: 'Perfil completo!',
        description: 'Suas informações foram salvas com sucesso. Bem-vindo à Menvo!',
        variant: 'default',
      })
      router.push('/dashboard') // Redirect to dashboard
    } catch (error: any) {
      toast({
        title: 'Erro ao completar perfil',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  if (!user) {
    // Should not happen if ProtectedRoute is working, but as a fallback
    router.push('/login')
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo à Menvo!</CardTitle>
          <CardDescription>
            Por favor, complete seu perfil para começar sua jornada de mentoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input id="full_name" value={formData.full_name || ''} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Nome de Usuário (Slug)</Label>
                <Input id="username" value={formData.username || ''} onChange={handleChange} placeholder="será usado na URL do seu perfil" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={formData.bio || ''} onChange={handleChange} rows={4} placeholder="Fale um pouco sobre você..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Localização</Label>
                <Input id="location" value={formData.location || ''} onChange={handleChange} placeholder="Cidade, País" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupation">Ocupação</Label>
                <Input id="occupation" value={formData.occupation || ''} onChange={handleChange} placeholder="Engenheiro de Software, Designer, etc." />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
              <Input
                id="skills"
                value={formData.skills?.join(', ') || ''}
                onChange={(e) => handleArrayChange(e, 'skills')}
                placeholder="React, Node.js, Design UX, Liderança"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="interests">Interesses (separadas por vírgula)</Label>
              <Input
                id="interests"
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => handleArrayChange(e, 'interests')}
                placeholder="Inteligência Artificial, Sustentabilidade, Empreendedorismo"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Completar Perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
