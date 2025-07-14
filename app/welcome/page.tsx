"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/app/context/auth-context"
import { useCompleteProfile } from "@/hooks/api/use-auth"
import { toast } from "sonner"
import { UserCheck, Users, Heart } from "lucide-react"

export default function WelcomePage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const completeProfile = useCompleteProfile()

  const [formData, setFormData] = useState({
    role: "",
    bio: "",
    location: "",
    linkedin_url: "",
    presentation_video_url: "",
    expertise_areas: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.role) {
      toast.error("Por favor, selecione seu tipo de usuário")
      return
    }

    try {
      await completeProfile.mutateAsync(formData)
      toast.success("Perfil completado com sucesso!")

      if (formData.role === "mentor") {
        toast.info("Seu perfil será analisado pela nossa equipe. Você receberá um email quando for aprovado.")
      }

      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Erro ao completar perfil")
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo à Menvo! 🎉</CardTitle>
          <CardDescription>Complete seu perfil para começar a usar a plataforma</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Tipo de Usuário */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Como você gostaria de contribuir?</Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${formData.role === "mentee" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"}`}
                  onClick={() => setFormData({ ...formData, role: "mentee" })}
                >
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Mentorado</h3>
                    <p className="text-sm text-muted-foreground">Quero receber mentoria</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${formData.role === "mentor" ? "ring-2 ring-green-500 bg-green-50" : "hover:shadow-md"}`}
                  onClick={() => setFormData({ ...formData, role: "mentor" })}
                >
                  <CardContent className="p-4 text-center">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">Mentor</h3>
                    <p className="text-sm text-muted-foreground">Quero oferecer mentoria</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${formData.role === "volunteer" ? "ring-2 ring-purple-500 bg-purple-50" : "hover:shadow-md"}`}
                  onClick={() => setFormData({ ...formData, role: "volunteer" })}
                >
                  <CardContent className="p-4 text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold">Voluntário</h3>
                    <p className="text-sm text-muted-foreground">Quero ajudar a plataforma</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Campos adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  placeholder="Ex: São Paulo, SP"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Campos específicos para mentores */}
            {formData.role === "mentor" && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Informações do Mentor</h3>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn (obrigatório)</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/seu-perfil"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentation_video_url">Vídeo de Apresentação (YouTube)</Label>
                  <Input
                    id="presentation_video_url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.presentation_video_url}
                    onChange={(e) => setFormData({ ...formData, presentation_video_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Grave um vídeo de 2-3 minutos se apresentando e explicando como pode ajudar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertise_areas">Áreas de Expertise</Label>
                  <Textarea
                    id="expertise_areas"
                    placeholder="Ex: Desenvolvimento Web, React, Node.js, Carreira em Tech..."
                    value={formData.expertise_areas}
                    onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={completeProfile.isPending || !formData.role}>
              {completeProfile.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Completando perfil...
                </>
              ) : (
                "Completar Perfil"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
