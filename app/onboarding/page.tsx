"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, User, Briefcase } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

type UserRole = "mentor" | "mentee"

export default function OnboardingPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    role: "mentee" as UserRole,
    location: "",
    avatar_url: "",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Pre-fill form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        avatar_url: user.user_metadata?.avatar_url || "",
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Usuário não autenticado")
      return
    }

    if (!formData.name.trim() || !formData.bio.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)

    try {
      // Chamar API Route para criar perfil como solicitado no prompt
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: user.email,
          bio: formData.bio.trim(),
          role: formData.role,
          avatar_url: formData.avatar_url,
          location: formData.location.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao criar perfil")
      }

      const result = await response.json()
      
      toast.success("Perfil criado com sucesso! Aguarde a validação.")
      
      // Redirect to dashboard or waiting page
      router.push("/dashboard")
      
    } catch (error: any) {
      console.error("Erro no onboarding:", error)
      toast.error(error.message || "Erro ao criar perfil")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo ao Menvo!</CardTitle>
            <CardDescription>
              Complete seu perfil para começar sua jornada de mentoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {formData.name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Foto
                </Button>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <Label>Qual é o seu objetivo na plataforma? *</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                    <RadioGroupItem value="mentee" id="mentee" />
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label htmlFor="mentee" className="font-medium cursor-pointer">
                          Quero ser Mentorado
                        </Label>
                        <p className="text-sm text-gray-600">
                          Busco orientação e aprendizado
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                    <RadioGroupItem value="mentor" id="mentor" />
                    <div className="flex items-center space-x-3">
                      <Briefcase className="h-5 w-5 text-green-600" />
                      <div>
                        <Label htmlFor="mentor" className="font-medium cursor-pointer">
                          Quero ser Mentor
                        </Label>
                        <p className="text-sm text-gray-600">
                          Quero compartilhar conhecimento
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <Label htmlFor="bio">
                  {formData.role === "mentor" ? "Experiência e Especialidades" : "Objetivos e Interesses"} *
                </Label>
                <Textarea
                  id="bio"
                  placeholder={
                    formData.role === "mentor"
                      ? "Conte sobre sua experiência profissional, áreas de especialidade e como pode ajudar outros..."
                      : "Conte sobre seus objetivos, áreas de interesse e o que gostaria de aprender..."
                  }
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Cidade, Estado/País"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Validation Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Processo de Validação:</strong> Após enviar seu perfil, nossa equipe fará uma revisão manual. 
                  Você receberá uma notificação quando seu perfil for aprovado e poderá acessar todas as funcionalidades da plataforma.
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando Perfil...
                  </>
                ) : (
                  "Criar Perfil"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
