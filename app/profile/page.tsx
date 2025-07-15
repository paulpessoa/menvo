"use client"

import type React from "react"
import { createClient } from "@/utils/supabase/client"
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import type { Profile } from "@/types/database"
import { Camera, Globe, Linkedin, FileText, Upload, X, Loader2, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  suggestions?: string[]
}

function CustomChipInput({ value, onChange, placeholder, suggestions = [] }: ChipInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions.filter(
    (suggestion) => suggestion.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(suggestion),
  )

  const addChip = (chip: string) => {
    if (chip.trim() && !value.includes(chip.trim())) {
      onChange([...value, chip.trim()])
      setInputValue("")
      setShowSuggestions(false)
    }
  }

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addChip(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((chip, index) => (
          <div
            key={index}
            className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
          >
            {chip}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeChip(index)} />
          </div>
        ))}
      </div>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => addChip(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<Partial<Profile>>({
    full_name: "",
    bio: "",
    location: "",
    linkedin_url: "",
    personal_website_url: "",
    expertise_areas: [] as string[],
    topics: [] as string[],
    inclusion_tags: [] as string[],
    languages: ["Português"] as string[],
    mentorship_approach: "",
    what_to_expect: "",
    ideal_mentee: "",
    cv_url: "",
  })

  const expertiseAreasSuggestions = [
    "Tecnologia",
    "Marketing",
    "Vendas",
    "Recursos Humanos",
    "Finanças",
    "Design",
    "Produto",
    "Estratégia",
    "Liderança",
    "Empreendedorismo",
  ]

  const topicsSuggestions = [
    "Carreira",
    "Networking",
    "Entrevistas",
    "Negociação",
    "Apresentações",
    "Gestão de Tempo",
    "Produtividade",
    "Inovação",
    "Criatividade",
  ]

  const inclusionTagsSuggestions = [
    "LGBTQIA+",
    "Mulheres na Tecnologia",
    "Pessoas Negras",
    "PCDs",
    "Primeira Geração na Universidade",
    "Baixa Renda",
    "Neurodiversidade",
  ]

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        linkedin_url: profile.linkedin_url || "",
        personal_website_url: profile.personal_website_url || "",
        expertise_areas: profile.expertise_areas || [],
        topics: profile.topics || [],
        inclusion_tags: profile.inclusion_tags || [],
        languages: profile.languages || ["Português"],
        mentorship_approach: profile.mentorship_approach || "",
        what_to_expect: profile.what_to_expect || "",
        ideal_mentee: profile.ideal_mentee || "",
        cv_url: profile.cv_url || "",
      })
    }
  }, [profile])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    if (!user) {
      toast.error("Você precisa estar logado para fazer o upload.")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Enviando imagem...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/profile-photo", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Falha no upload da imagem.")
      }

      toast.success("Avatar atualizado com sucesso!", { id: toastId })
      await refreshProfile() // Refresh profile to show new avatar
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Usuário não encontrado.")
      return
    }

    const toastId = toast.loading("Atualizando perfil...")
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update(formData).eq("id", user.id)

    if (error) {
      toast.error(`Erro ao atualizar perfil: ${error.message}`, { id: toastId })
    } else {
      toast.success("Perfil atualizado com sucesso!", { id: toastId })
      await refreshProfile()
    }
  }

  if (loading) {
    return <div>Carregando perfil...</div>
  }

  if (!user || !profile) {
    return <div>Você precisa estar logado para ver esta página.</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="professional">Profissional</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
              <TabsTrigger value="mentorship">Mentoria</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Suas informações pessoais básicas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{profile.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </Button>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Conte um pouco sobre você..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Profissionais</CardTitle>
                  <CardDescription>Suas informações de carreira e links profissionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/seu-perfil"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal_website_url">Site Pessoal/Profissional</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="personal_website_url"
                        name="personal_website_url"
                        value={formData.personal_website_url}
                        onChange={handleInputChange}
                        placeholder="https://seusite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Documentos e Integrações</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => alert("Upload de Currículo - Ferramenta em desenvolvimento")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir CV (PDF)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => alert("Autopreencher com LinkedIn - Ferramenta em desenvolvimento")}
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => alert("Autopreencher com Lattes - Ferramenta em desenvolvimento")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Lattes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Localização</CardTitle>
                  <CardDescription>
                    Sua localização (endereço completo fica privado, apenas cidade/estado/país são públicos)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Ex: São Paulo, Brasil"
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Privacidade:</strong> Seu endereço completo nunca é exibido publicamente. Apenas cidade,
                      estado e país são visíveis para outros usuários.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentorship" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Mentoria</CardTitle>
                  <CardDescription>Configure seu perfil como mentor (todas as mentorias são gratuitas)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Idiomas</Label>
                    <CustomChipInput
                      value={formData.languages}
                      onChange={(value) => setFormData((prev) => ({ ...prev, languages: value }))}
                      placeholder="Digite um idioma e pressione Enter"
                      suggestions={["Português", "English", "Español"]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Áreas de Expertise</Label>
                    <CustomChipInput
                      value={formData.expertise_areas}
                      onChange={(value) => setFormData((prev) => ({ ...prev, expertise_areas: value }))}
                      placeholder="Digite uma área de expertise e pressione Enter"
                      suggestions={expertiseAreasSuggestions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tópicos de Mentoria</Label>
                    <CustomChipInput
                      value={formData.topics}
                      onChange={(value) => setFormData((prev) => ({ ...prev, topics: value }))}
                      placeholder="Digite um tópico e pressione Enter"
                      suggestions={topicsSuggestions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags Inclusivas</Label>
                    <CustomChipInput
                      value={formData.inclusion_tags}
                      onChange={(value) => setFormData((prev) => ({ ...prev, inclusion_tags: value }))}
                      placeholder="Digite uma tag inclusiva e pressione Enter"
                      suggestions={inclusionTagsSuggestions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mentorship_approach">Abordagem da Mentoria</Label>
                    <Textarea
                      id="mentorship_approach"
                      name="mentorship_approach"
                      value={formData.mentorship_approach}
                      onChange={handleInputChange}
                      placeholder="Descreva sua abordagem como mentor..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="what_to_expect">O que Esperar</Label>
                    <Textarea
                      id="what_to_expect"
                      name="what_to_expect"
                      value={formData.what_to_expect}
                      onChange={handleInputChange}
                      placeholder="O que os mentorados podem esperar das suas sessões..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ideal_mentee">Mentee Ideal</Label>
                    <Textarea
                      id="ideal_mentee"
                      name="ideal_mentee"
                      value={formData.ideal_mentee}
                      onChange={handleInputChange}
                      placeholder="Descreva o perfil ideal do seu mentee..."
                      rows={3}
                    />
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Mentorias Gratuitas:</strong> Todas as mentorias na plataforma são gratuitas e baseadas em
                      voluntariado.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Perfil"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
