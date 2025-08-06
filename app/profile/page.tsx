'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { updateUserProfile } from '@/services/auth/supabase'
import { Loader2Icon, CameraIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Database } from '@/types/database'
import { supabase } from '@/services/auth/supabase' // Import the client for file uploads

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export default function ProfilePage() {
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
    avatar_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        occupation: userProfile.occupation || '',
        skills: userProfile.skills || [],
        interests: userProfile.interests || [],
        avatar_url: userProfile.avatar_url || '',
      })
    }
  }, [userProfile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'skills' | 'interests') => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value.split(',').map((item) => item.trim()) }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
      setFormData((prev) => ({ ...prev, avatar_url: URL.createObjectURL(e.target.files![0]) }))
    }
  }

  const uploadAvatar = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Ensure you have a bucket named 'avatars' in Supabase Storage
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para atualizar seu perfil.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      let newAvatarUrl = formData.avatar_url

      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile, user.id)
      }

      const updates = {
        ...formData,
        avatar_url: newAvatarUrl,
        is_profile_complete: true, // Mark profile as complete after first save
      }

      const { error } = await updateUserProfile(user.id, updates)

      if (error) {
        throw error
      }

      mutateProfile() // Trigger re-fetch of profile data
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
        variant: 'default',
      })
      router.push('/dashboard') // Redirect to dashboard after saving
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
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
        <span className="ml-2">Carregando perfil...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-lg mb-6">Você precisa estar logado para acessar seu perfil.</p>
        <Link href="/login" passHref>
          <Button>Fazer Login</Button>
        </Link>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Meu Perfil</h1>

        <Card className="max-w-3xl mx-auto p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Editar Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais e profissionais.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={formData.avatar_url || '/placeholder-user.jpg'} alt="Avatar" />
                    <AvatarFallback>{formData.full_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/90">
                    <CameraIcon className="h-5 w-5 text-primary-foreground" />
                    <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">Clique na câmera para mudar a foto de perfil</p>
              </div>

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
                <Label htmlFor="interests">Interesses (separados por vírgula)</Label>
                <Input
                  id="interests"
                  value={formData.interests?.join(', ') || ''}
                  onChange={(e) => handleArrayChange(e, 'interests')}
                  placeholder="Inteligência Artificial, Sustentabilidade, Empreendedorismo"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
