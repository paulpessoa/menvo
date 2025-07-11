"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Linkedin, Save, Loader2, GraduationCap, Users, X, Upload, Camera, FileText, Award } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useUserRoleManagement } from "@/hooks/useRoleManagement"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { GoogleMapsService } from "@/services/maps/googleMaps"

interface ProfileFormData {
  first_name?: string
  last_name?: string
  bio?: string
  slug?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  personal_website_url?: string
  languages?: string[]
}

interface MentorFormData extends ProfileFormData {
  title?: string
  company?: string
  experience_years?: number
  expertise_areas?: string[]
  topics?: string[]
  inclusion_tags?: string[]
  mentorship_approach?: string
  what_to_expect?: string
  ideal_mentee?: string
  cv_url?: string
}

const LANGUAGE_OPTIONS = ["Português", "English", "Español"]

const EXPERTISE_SUGGESTIONS = [
  "Desenvolvimento de Software",
  "Design UX/UI",
  "Marketing Digital",
  "Gestão de Projetos",
  "Empreendedorismo",
  "Liderança",
  "Vendas",
  "Recursos Humanos",
  "Finanças",
  "Data Science",
  "Inteligência Artificial",
  "Produto",
  "Estratégia",
  "Consultoria",
]

const TOPIC_SUGGESTIONS = [
  "Transição de Carreira",
  "Primeiro Emprego",
  "Liderança",
  "Empreendedorismo",
  "Desenvolvimento Pessoal",
  "Networking",
  "Negociação",
  "Apresentações",
  "Gestão de Tempo",
  "Work-Life Balance",
  "Inovação",
  "Criatividade",
]

const INCLUSION_TAGS = [
  "Mulheres",
  "LGBTQIA+",
  "50+",
  "Neurodivergente",
  "Pessoas Negras",
  "Indígenas",
  "Pessoas com Deficiência",
  "Primeira Geração Universitária",
  "Imigrantes",
  "Refugiados",
]

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { userState, completeUserProfile, isLoading } = useUserRoleManagement()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState("profile")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<ProfileFormData>({})
  const [mentorData, setMentorData] = useState<MentorFormData>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // Determinar role atual
  const currentRole = roleParam || userState?.role || "mentee"
  const isMentor = currentRole === "mentor"

  // Redirecionar se usuário não está logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Carregar dados do perfil
  useEffect(() => {
    if (userState) {
      setProfileData({
        first_name: userState.first_name || "",
        last_name: userState.last_name || "",
        bio: userState.bio || "",
        slug: userState.slug || "",
        address: userState.address || "",
        city: userState.city || "",
        state: userState.state || "",
        country: userState.country || "",
        linkedin_url: userState.linkedin_url || "",
        github_url: userState.github_url || "",
        portfolio_url: userState.portfolio_url || "",
        personal_website_url: userState.personal_website_url || "",
        languages: userState.languages || ["Português"],
      })
      setAvatarPreview(userState.avatar_url || "")
    }
  }, [userState])

  // Upload de avatar
  const handleAvatarUpload = async (file: File) => {
    if (!user) return

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("profiles").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Erro no upload:", error)
      throw error
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Busca de endereços com Google Maps
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      const results = await GoogleMapsService.geocode(query)
      setAddressSuggestions(results.slice(0, 5))
      setShowAddressSuggestions(true)
    } catch (error) {
      console.error("Erro na busca de endereços:", error)
    }
  }

  const handleAddressSelect = (result: any) => {
    const addressComponents = result.formatted_address.split(", ")

    setProfileData((prev) => ({
      ...prev,
      address: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      city: addressComponents[addressComponents.length - 3] || "",
      state: addressComponents[addressComponents.length - 2] || "",
      country: addressComponents[addressComponents.length - 1] || "",
    }))

    setShowAddressSuggestions(false)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let avatarUrl = avatarPreview

      // Upload avatar se houver arquivo
      if (avatarFile) {
        avatarUrl = await handleAvatarUpload(avatarFile)
      }

      const submitData = {
        ...profileData,
        avatar_url: avatarUrl,
        ...(isMentor && mentorData),
      }

      await completeUserProfile.mutate(submitData, {
        onSuccess: () => {
          toast.success("Perfil atualizado com sucesso!")
          router.push("/dashboard")
        },
        onError: (error) => {
          console.error("Erro ao atualizar perfil:", error)
          toast.error("Erro ao atualizar perfil. Tente novamente.")
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funções para gerenciar chips
  const addChip = (field: keyof MentorFormData, value: string, suggestions: string[]) => {
    if (!value.trim()) return

    const currentValues = (mentorData[field] as string[]) || []
    if (!currentValues.includes(value)) {
      setMentorData((prev) => ({
        ...prev,
        [field]: [...currentValues, value],
      }))
    }
  }

  const removeChip = (field: keyof MentorFormData, value: string) => {
    const currentValues = (mentorData[field] as string[]) || []
    setMentorData((prev) => ({
      ...prev,
      [field]: currentValues.filter((item) => item !== value),
    }))
  }

  const ChipInput = ({
    field,
    label,
    suggestions,
    placeholder,
  }: {
    field: keyof MentorFormData
    label: string
    suggestions: string[]
    placeholder: string
  }) => {
    const [inputValue, setInputValue] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const currentValues = (mentorData[field] as string[]) || []

    const filteredSuggestions = suggestions.filter(
      (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !currentValues.includes(s),
    )

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addChip(field, inputValue, suggestions)
                setInputValue("")
                setShowSuggestions(false)
              }
            }}
            placeholder={placeholder}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    addChip(field, suggestion, suggestions)
                    setInputValue("")
                    setShowSuggestions(false)
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {currentValues.map((value) => (
            <Badge key={value} variant="secondary" className="flex items-center gap-1">
              {value}
              <button type="button" onClick={() => removeChip(field, value)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    )
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
            {isMentor ? (
              <Users className="h-8 w-8 text-blue-600" />
            ) : (
              <GraduationCap className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Complete seu perfil</h1>
            <p className="text-xl text-muted-foreground mt-2">
              {isMentor
                ? "Configure seu perfil de mentor para começar a orientar outros profissionais"
                : "Complete seu perfil para encontrar os melhores mentores"}
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
                : "Adicione suas informações para encontrar mentores adequados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarPreview || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback>
                    <Camera className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-1">JPG, PNG ou GIF. Máximo 5MB.</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Seu sobrenome"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL do Perfil</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    menvo.com.br/perfil/
                  </span>
                  <Input
                    id="slug"
                    value={profileData.slug || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="seu-nome"
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio || ""}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder={
                    isMentor
                      ? "Conte sobre sua experiência profissional e como você pode ajudar mentees..."
                      : "Conte sobre seus objetivos profissionais e áreas de interesse..."
                  }
                  rows={4}
                />
              </div>

              {/* Location with Google Maps */}
              <div className="space-y-2">
                <Label htmlFor="address">Localização</Label>
                <div className="relative">
                  <Input
                    ref={addressInputRef}
                    id="address"
                    value={profileData.address || ""}
                    onChange={(e) => {
                      setProfileData((prev) => ({ ...prev, address: e.target.value }))
                      handleAddressSearch(e.target.value)
                    }}
                    placeholder="Digite seu endereço..."
                  />

                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {suggestion.formatted_address}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Apenas cidade, estado e país serão exibidos publicamente
                </p>
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <Label>Idiomas</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <Badge
                      key={language}
                      variant={profileData.languages?.includes(language) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentLanguages = profileData.languages || []
                        if (currentLanguages.includes(language)) {
                          setProfileData((prev) => ({
                            ...prev,
                            languages: currentLanguages.filter((l) => l !== language),
                          }))
                        } else {
                          setProfileData((prev) => ({
                            ...prev,
                            languages: [...currentLanguages, language],
                          }))
                        }
                      }}
                    >
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input
                    id="linkedin_url"
                    value={profileData.linkedin_url || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_url">Portfólio</Label>
                  <Input
                    id="portfolio_url"
                    value={profileData.portfolio_url || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, portfolio_url: e.target.value }))}
                    placeholder="https://seu-portfolio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub</Label>
                  <Input
                    id="github_url"
                    value={profileData.github_url || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/seu-usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal_website_url">Site Pessoal/Profissional</Label>
                  <Input
                    id="personal_website_url"
                    value={profileData.personal_website_url || ""}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, personal_website_url: e.target.value }))}
                    placeholder="https://seu-site.com"
                  />
                </div>
              </div>

              {/* Mentor-specific fields */}
              {isMentor && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Informações de Mentor</h3>

                    {/* CV Upload and Auto-fill buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast.info("Ferramenta em desenvolvimento")}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Upload CV (PDF)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast.info("Ferramenta em desenvolvimento")}
                        className="flex items-center gap-2"
                      >
                        <Linkedin className="h-4 w-4" />
                        Preencher com LinkedIn
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast.info("Ferramenta em desenvolvimento")}
                        className="flex items-center gap-2"
                      >
                        <Award className="h-4 w-4" />
                        Preencher com Lattes
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Cargo Atual</Label>
                        <Input
                          id="title"
                          value={mentorData.title || ""}
                          onChange={(e) => setMentorData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Senior Developer, Tech Lead"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                          id="company"
                          value={mentorData.company || ""}
                          onChange={(e) => setMentorData((prev) => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Anos de Experiência</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={mentorData.experience_years || ""}
                          onChange={(e) =>
                            setMentorData((prev) => ({ ...prev, experience_years: Number.parseInt(e.target.value) }))
                          }
                          placeholder="5"
                        />
                      </div>
                    </div>

                    {/* Chip Inputs */}
                    <div className="space-y-4 mt-4">
                      <ChipInput
                        field="expertise_areas"
                        label="Áreas de Expertise"
                        suggestions={EXPERTISE_SUGGESTIONS}
                        placeholder="Digite ou selecione uma área de expertise"
                      />

                      <ChipInput
                        field="topics"
                        label="Tópicos de Mentoria"
                        suggestions={TOPIC_SUGGESTIONS}
                        placeholder="Digite ou selecione um tópico"
                      />

                      <ChipInput
                        field="inclusion_tags"
                        label="Tags Inclusivas"
                        suggestions={INCLUSION_TAGS}
                        placeholder="Selecione grupos que você tem afinidade para mentorar"
                      />
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="mentorship_approach">Abordagem de Mentoria</Label>
                      <Textarea
                        id="mentorship_approach"
                        value={mentorData.mentorship_approach || ""}
                        onChange={(e) => setMentorData((prev) => ({ ...prev, mentorship_approach: e.target.value }))}
                        placeholder="Como você aborda as sessões de mentoria? Qual é sua metodologia?"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="what_to_expect">O que esperar</Label>
                      <Textarea
                        id="what_to_expect"
                        value={mentorData.what_to_expect || ""}
                        onChange={(e) => setMentorData((prev) => ({ ...prev, what_to_expect: e.target.value }))}
                        placeholder="O que mentees podem esperar das suas sessões?"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="ideal_mentee">Mentee Ideal</Label>
                      <Textarea
                        id="ideal_mentee"
                        value={mentorData.ideal_mentee || ""}
                        onChange={(e) => setMentorData((prev) => ({ ...prev, ideal_mentee: e.target.value }))}
                        placeholder="Descreva o perfil do mentee ideal para suas sessões"
                        rows={3}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                      <p className="text-sm text-blue-800">
                        <strong>Importante:</strong> Todas as mentorias na nossa plataforma são gratuitas. Nosso
                        objetivo é democratizar o acesso ao conhecimento e desenvolvimento profissional.
                      </p>
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
