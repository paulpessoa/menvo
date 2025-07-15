"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function ProfilePage() {
  const { profile, updateProfile, refreshProfile, user } = useAuth()
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    linkedin_url: profile?.linkedin_url || "",
    presentation_video_url: profile?.presentation_video_url || "",
    expertise_areas: profile?.expertise_areas || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error("Por favor, selecione um arquivo de imagem.")
      return
    }
    if (!user) {
      toast.error("Usuário não encontrado.")
      return
    }

    setIsUploading(true)
    try {
      const fileExt = avatarFile.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const formData = new FormData()
      formData.append("file", avatarFile)
      formData.append("filePath", filePath)

      const response = await fetch("/api/upload/profile-photo", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Falha no upload da imagem.")
      }

      await refreshProfile()
      toast.success("Foto de perfil atualizada com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
      setAvatarFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { error } = await updateProfile(formData)
      if (error) {
        throw new Error(error)
      }
      toast.success("Perfil atualizado com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Seu Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais e profissionais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} alt="User avatar" />
                <AvatarFallback>{profile.first_name?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar-upload">Atualizar foto de perfil</Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="max-w-xs"
                />
                <Button onClick={handleAvatarUpload} disabled={isUploading || !avatarFile} size="sm">
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Fazer Upload
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte-nos um pouco sobre você..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              {profile.role === "mentor" && (
                <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
                  <h3 className="font-semibold">Informações de Mentor</h3>
                  <div className="space-y-2">
                    <Label htmlFor="expertise_areas">Áreas de Expertise</Label>
                    <Input
                      id="expertise_areas"
                      placeholder="Ex: React, Gestão de Produtos, UI/UX"
                      value={formData.expertise_areas}
                      onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">URL do LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/in/seu-perfil"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presentation_video_url">URL do Vídeo de Apresentação</Label>
                    <Input
                      id="presentation_video_url"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={formData.presentation_video_url}
                      onChange={(e) => setFormData({ ...formData, presentation_video_url: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
