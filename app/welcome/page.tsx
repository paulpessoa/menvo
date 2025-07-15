"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/app/context/auth-context"
import { useCompleteProfile } from "@/hooks/api/use-auth"
import { toast } from "sonner"
import { UserCheck, Users, Heart, Loader2 } from "lucide-react"

export default function WelcomePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { mutateAsync: completeProfile, isPending: isCompleting } = useCompleteProfile()

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "" as "mentee" | "mentor" | "volunteer" | "",
    bio: "",
    location: "",
    linkedin_url: "",
    presentation_video_url: "",
    expertise_areas: "",
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (profile && profile.role !== "pending") {
        router.push("/dashboard")
      } else if (profile) {
        setFormData((prev) => ({
          ...prev,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
        }))
      }
    }
  }, [user, profile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.role) {
      toast.error("Por favor, selecione como você quer usar a plataforma.")
      return
    }
    if (!formData.first_name || !formData.last_name) {
      toast.error("Nome e sobrenome são obrigatórios.")
      return
    }
    if (formData.role === "mentor" && !formData.linkedin_url) {
      toast.error("Para mentores, a URL do LinkedIn é obrigatória.")
      return
    }

    try {
      await completeProfile(formData)
      toast.success("Perfil completado com sucesso!")

      if (formData.role === "mentor") {
        toast.info("Seu perfil de mentor será analisado pela nossa equipe. Você receberá um email quando for aprovado.")
      }

      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Erro ao completar perfil")
    }
  }

  if (authLoading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo(a) à Menvo! 🎉</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Falta pouco! Complete seu perfil para começar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Como você gostaria de contribuir? *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "mentee", icon: Users, label: "Mentorado", desc: "Quero receber mentoria" },
                  { value: "mentor", icon: UserCheck, label: "Mentor", desc: "Quero oferecer mentoria" },
                  { value: "volunteer", icon: Heart, label: "Voluntário", desc: "Quero ajudar a plataforma" },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <Card
                    key={value}
                    className={`cursor-pointer transition-all ${
                      formData.role === value ? "ring-2 ring-primary bg-primary/10" : "hover:shadow-md"
                    }`}
                    onClick={() => setFormData({ ...formData, role: value as any })}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">{label}</h3>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                placeholder="Conte um pouco sobre sua jornada, seus interesses e o que você busca na plataforma."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>

            {formData.role === "mentor" && (
              <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-foreground">Informações Adicionais de Mentor</h3>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">URL do LinkedIn *</Label>
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
                  <Label htmlFor="presentation_video_url">Vídeo de Apresentação (Opcional)</Label>
                  <Input
                    id="presentation_video_url"
                    type="url"
                    placeholder="Link do YouTube, Loom, etc."
                    value={formData.presentation_video_url}
                    onChange={(e) => setFormData({ ...formData, presentation_video_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expertise_areas">Áreas de Expertise</Label>
                  <Input
                    id="expertise_areas"
                    placeholder="Ex: React, Gestão de Produtos, UI/UX (separado por vírgulas)"
                    value={formData.expertise_areas}
                    onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isCompleting || !formData.role}>
              {isCompleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Completar Perfil e Acessar a Plataforma"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
