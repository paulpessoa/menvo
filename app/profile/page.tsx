"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github, 
  ExternalLink, 
  Save, 
  Loader2,
  GraduationCap,
  Users,
  Calendar,
  Star,
  MessageSquare,
  Settings,
  Plus,
  X
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useUserRoleManagement } from "@/hooks/useRoleManagement"
import { toast } from "sonner"

interface ProfileFormData {
  first_name?: string
  last_name?: string
  bio?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  languages?: string[]
}

interface MentorFormData extends ProfileFormData {
  title?: string
  company?: string
  experience_years?: number
  expertise_areas?: string[]
  topics?: string[]
  session_duration?: number
  session_price?: number
  currency?: string
  mentorship_approach?: string
  what_to_expect?: string
  ideal_mentee?: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { userState, completeUserProfile, isLoading } = useUserRoleManagement()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  
  const [activeTab, setActiveTab] = useState("profile")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<ProfileFormData>({})
  const [mentorData, setMentorData] = useState<MentorFormData>({})
  const [newLanguage, setNewLanguage] = useState("")
  const [newExpertise, setNewExpertise] = useState("")
  const [newTopic, setNewTopic] = useState("")

  // Determinar role atual
  const currentRole = roleParam || userState?.role || 'mentee'
  const isMentor = currentRole === 'mentor'

  // Redirecionar se usuário não está logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Carregar dados do perfil
  useEffect(() => {
    if (userState) {
      setProfileData({
        first_name: userState.first_name || "",
        last_name: userState.last_name || "",
        bio: userState.bio || "",
        location: userState.location || "",
        linkedin_url: userState.linkedin_url || "",
        github_url: userState.github_url || "",
        website_url: userState.website_url || "",
        languages: userState.languages || []
      })
    }
  }, [userState])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...profileData,
        ...(isMentor && mentorData)
      }

      await completeUserProfile.mutate(submitData, {
        onSuccess: () => {
          toast.success('Perfil atualizado com sucesso!')
          router.push('/dashboard')
        },
        onError: (error) => {
          console.error('Erro ao atualizar perfil:', error)
          toast.error('Erro ao atualizar perfil. Tente novamente.')
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLanguage = () => {
    if (newLanguage && !profileData.languages?.includes(newLanguage)) {
      setProfileData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage]
      }))
      setNewLanguage("")
    }
  }

  const removeLanguage = (language: string) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages?.filter(l => l !== language) || []
    }))
  }

  const addExpertise = () => {
    if (newExpertise && !mentorData.expertise_areas?.includes(newExpertise)) {
      setMentorData(prev => ({
        ...prev,
        expertise_areas: [...(prev.expertise_areas || []), newExpertise]
      }))
      setNewExpertise("")
    }
  }

  const removeExpertise = (expertise: string) => {
    setMentorData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas?.filter(e => e !== expertise) || []
    }))
  }

  const addTopic = () => {
    if (newTopic && !mentorData.topics?.includes(newTopic)) {
      setMentorData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), newTopic]
      }))
      setNewTopic("")
    }
  }

  const removeTopic = (topic: string) => {
    setMentorData(prev => ({
      ...prev,
      topics: prev.topics?.filter(t => t !== topic) || []
    }))
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container max-w-4xl py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
      </div>
    )
  }

  // Se usuário não está logado, não renderizar
  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl py-16">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            {isMentor ? <Users className="h-8 w-8 text-blue-600" /> : <GraduationCap className="h-8 w-8 text-blue-600" />}
          </div>
        <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Complete seu perfil
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              {isMentor 
                ? "Configure seu perfil de mentor para começar a orientar outros profissionais"
                : "Complete seu perfil para encontrar os melhores mentores"
              }
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex justify-center">
          <Badge variant={isMentor ? "default" : "secondary"} className="text-lg px-4 py-2">
            {isMentor ? "Mentor" : "Mentee"}
          </Badge>
      </div>

        {/* Profile Form */}
          <Card>
            <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>
              {isMentor 
                ? "Configure suas informações profissionais e áreas de expertise"
                : "Adicione suas informações para encontrar mentores adequados"
              }
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                    <Input
                      id="first_name"
                    value={profileData.first_name || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                    <Input
                    id="last_name"
                    value={profileData.last_name || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Seu sobrenome"
                  />
                </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                  value={profileData.bio || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={isMentor 
                    ? "Conte sobre sua experiência profissional e como você pode ajudar mentees..."
                    : "Conte sobre seus objetivos profissionais e áreas de interesse..."
                  }
                    rows={4}
                  />
                </div>

                  <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={profileData.location || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Cidade, Estado"
                />
                  </div>

              {/* Languages */}
                  <div className="space-y-2">
                <Label>Idiomas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Adicionar idioma"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  />
                  <Button type="button" onClick={addLanguage} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.languages?.map((language) => (
                    <Badge key={language} variant="secondary" className="flex items-center gap-1">
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  </div>
                </div>

                {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                    value={profileData.linkedin_url || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/seu-perfil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub</Label>
                  <Input
                    id="github_url"
                    value={profileData.github_url || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/seu-usuario"
                  />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    value={profileData.website_url || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://seu-site.com"
                  />
                </div>
              </div>

              {/* Mentor-specific fields */}
              {isMentor && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Informações de Mentor</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Cargo Atual</Label>
                        <Input
                          id="title"
                          value={mentorData.title || ""}
                          onChange={(e) => setMentorData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Senior Developer, Tech Lead"
                        />
                  </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                    <Input
                          id="company"
                          value={mentorData.company || ""}
                          onChange={(e) => setMentorData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome da empresa"
                        />
                </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Anos de Experiência</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={mentorData.experience_years || ""}
                          onChange={(e) => setMentorData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session_duration">Duração da Sessão (min)</Label>
                        <Select
                          value={mentorData.session_duration?.toString() || "60"}
                          onValueChange={(value) => setMentorData(prev => ({ ...prev, session_duration: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="45">45 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="90">1.5 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session_price">Preço da Sessão</Label>
                        <Input
                          id="session_price"
                          type="number"
                          value={mentorData.session_price || ""}
                          onChange={(e) => setMentorData(prev => ({ ...prev, session_price: parseFloat(e.target.value) }))}
                          placeholder="0.00"
                    />
                  </div>
                </div>

                    {/* Expertise Areas */}
                    <div className="space-y-2 mt-4">
                      <Label>Áreas de Expertise</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newExpertise}
                          onChange={(e) => setNewExpertise(e.target.value)}
                          placeholder="Adicionar área de expertise"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                        />
                        <Button type="button" onClick={addExpertise} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
          </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentorData.expertise_areas?.map((expertise) => (
                          <Badge key={expertise} variant="secondary" className="flex items-center gap-1">
                            {expertise}
                            <button
                            type="button"
                              onClick={() => removeExpertise(expertise)}
                              className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                            </button>
                        </Badge>
                      ))}
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="space-y-2 mt-4">
                      <Label>Tópicos de Mentoria</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                          placeholder="Adicionar tópico"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                      />
                      <Button type="button" onClick={addTopic} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentorData.topics?.map((topic) => (
                          <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                            {topic}
                            <button
                              type="button"
                              onClick={() => removeTopic(topic)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                  </div>
                  </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="mentorship_approach">Abordagem de Mentoria</Label>
                      <Textarea
                        id="mentorship_approach"
                        value={mentorData.mentorship_approach || ""}
                        onChange={(e) => setMentorData(prev => ({ ...prev, mentorship_approach: e.target.value }))}
                        placeholder="Como você aborda as sessões de mentoria? Qual é sua metodologia?"
                        rows={3}
                      />
            </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="what_to_expect">O que esperar</Label>
                      <Textarea
                        id="what_to_expect"
                        value={mentorData.what_to_expect || ""}
                        onChange={(e) => setMentorData(prev => ({ ...prev, what_to_expect: e.target.value }))}
                        placeholder="O que mentees podem esperar das suas sessões?"
                        rows={3}
                  />
                </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="ideal_mentee">Mentee Ideal</Label>
                      <Textarea
                        id="ideal_mentee"
                        value={mentorData.ideal_mentee || ""}
                        onChange={(e) => setMentorData(prev => ({ ...prev, ideal_mentee: e.target.value }))}
                        placeholder="Descreva o perfil do mentee ideal para suas sessões"
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-5 w-5 mr-2" />
                      Salvar Perfil
                    </span>
                  )}
                    </Button>
                  </div>
            </form>
              </CardContent>
            </Card>
          </div>
    </div>
  )
}
