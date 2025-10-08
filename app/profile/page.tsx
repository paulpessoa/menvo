"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Camera, Globe, Linkedin, FileText, X, Loader2, Eye, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/useProfile"
import { useSimpleImageUpload, useSimplePDFUpload } from "@/hooks/useSimpleUpload"
import { toast } from "sonner"

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  suggestions?: string[]
}

function ChipInput({ value, onChange, placeholder, suggestions = [] }: ChipInputProps) {
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
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {chip}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeChip(index)} />
          </Badge>
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
  const { user, refreshProfile } = useAuth()
  const { profile, loading, isUpdating, updateProfile } = useProfile()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const imageUpload = useSimpleImageUpload('/api/upload/profile-photo')
  const cvUpload = useSimplePDFUpload('/api/upload/cv')

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    slug: "",
    bio: "",
    current_position: "",
    current_company: "",
    linkedin_url: "",
    portfolio_url: "",
    personal_website_url: "",
    avatar_url: "",
    address: "",
    city: "",
    state: "",
    country: "",
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
    "Tecnologia", "Marketing", "Vendas", "Recursos Humanos", "Finanças",
    "Design", "Produto", "Estratégia", "Liderança", "Empreendedorismo"
  ]

  const topicsSuggestions = [
    "Carreira", "Networking", "Entrevistas", "Negociação", "Apresentações",
    "Gestão de Tempo", "Produtividade", "Inovação", "Criatividade"
  ]

  const inclusionTagsSuggestions = [
    "LGBTQIA+", "Mulheres na Tecnologia", "Pessoas Negras", "PCDs",
    "Primeira Geração na Universidade", "Baixa Renda", "Neurodiversidade"
  ]

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (profile) {


      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        slug: profile.slug || "",
        bio: profile.bio || "",
        current_position: profile.current_position || "",
        current_company: profile.current_company || "",
        linkedin_url: profile.linkedin_url || "",
        portfolio_url: profile.portfolio_url || "",
        personal_website_url: profile.personal_website_url || "",
        avatar_url: profile.avatar_url || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
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
  }, [user, profile, router])

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await imageUpload.upload(file)

    if (result.success) {
      const avatarUrl = result.data.url + '?t=' + Date.now()
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
      await refreshProfile()
      toast.success("Foto atualizada com sucesso!")
    } else {
      toast.error(result.error || "Erro no upload da imagem")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error("Apenas arquivos PDF são permitidos")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("O arquivo deve ter no máximo 5MB")
      return
    }

    const result = await cvUpload.upload(file)

    if (result.success) {
      const cvUrl = result.data.url;
      setFormData(prev => ({ ...prev, cv_url: cvUrl }))

      // Also refresh the profile to ensure data is in sync
      await refreshProfile()

      toast.success("CV enviado com sucesso!")
    } else {
      toast.error(result.error || "Erro no upload do CV")
    }

    if (cvInputRef.current) {
      cvInputRef.current.value = ""
    }
  }

  const handleCVRemove = async () => {
    if (!formData.cv_url) return

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.")
        return
      }

      const response = await fetch('/api/upload/cv', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        setFormData(prev => ({ ...prev, cv_url: "" }))
        toast.success("CV removido com sucesso!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erro ao remover CV")
      }
    } catch (error) {
      console.error("Error removing CV:", error)
      toast.error("Erro ao remover CV")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Nome e sobrenome são obrigatórios")
      return
    }

    const result = await updateProfile(formData)

    if (result.success) {
      toast.success("Perfil atualizado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao atualizar perfil")
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg font-medium">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
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
                  <div>
                    <Label>Alterar Foto</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Avatar className="h-20 w-20" key={formData.avatar_url || 'no-avatar'}>
                        <AvatarImage src={formData.avatar_url || "/placeholder.svg"} />

                        <AvatarFallback>
                          {formData.first_name?.[0]}
                          {formData.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUpload.isUploading || isUpdating}
                        >
                          {imageUpload.isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Alterar Foto
                            </>
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nome *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Sobrenome *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug do Perfil</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="seu-nome-perfil"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Seu perfil será acessível em: menvo.com.br/perfil/{formData.slug || 'seu-slug'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="current_position">Cargo Atual</Label>
                      <Input
                        id="current_position"
                        value={formData.current_position}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_position: e.target.value }))}
                        placeholder="Ex: Desenvolvedor Senior"
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_company">Empresa Atual</Label>
                      <Input
                        id="current_company"
                        value={formData.current_company}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_company: e.target.value }))}
                        placeholder="Ex: Tech Company"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                        placeholder="https://linkedin.com/in/seu-perfil"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="portfolio_url">Portfólio</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="portfolio_url"
                        value={formData.portfolio_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                        placeholder="https://seu-portfolio.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="personal_website_url">Site Pessoal/Profissional</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="personal_website_url"
                        value={formData.personal_website_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, personal_website_url: e.target.value }))}
                        placeholder="https://seu-site.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentos e Integrações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* CV Upload Section */}
                  <div className="space-y-3">
                    <Label>Currículo (PDF)</Label>
                    <p className="text-sm text-gray-500">
                      Clique para enviar seu CV ou arraste e solte o arquivo aqui
                    </p>


                    {formData.cv_url && formData.cv_url.trim() !== "" ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">CV enviado com sucesso</p>
                            <p className="text-sm text-green-600">Arquivo PDF salvo e disponível para visualização</p>
                            <p className="text-xs text-green-500 mt-1">
                              Última atualização: {new Date().toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.cv_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCVRemove}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-4">Selecionar arquivo PDF</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => cvInputRef.current?.click()}
                          disabled={cvUpload.isUploading}
                        >
                          {cvUpload.isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            "Enviar CV (PDF)"
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          Apenas arquivos PDF são aceitos (máximo 5MB)
                        </p>
                        <p className="text-sm text-gray-500">
                          Seu CV será analisado automaticamente para preencher campos do perfil
                        </p>
                      </div>
                    )}

                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleCVUpload}
                      className="hidden"
                    />
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
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="SP"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Brasil"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Privacidade:</strong> Seu endereço completo nunca é exibido publicamente.
                      Apenas cidade, estado e país são visíveis para outros usuários.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentorship" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Mentoria</CardTitle>
                  <CardDescription>
                    Configure seu perfil como mentor (todas as mentorias são gratuitas)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Idiomas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Português", "English", "Español"].map((lang) => (
                        <label key={lang} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.languages.includes(lang)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  languages: [...prev.languages, lang]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  languages: prev.languages.filter(l => l !== lang)
                                }))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Áreas de Expertise</Label>
                    <ChipInput
                      value={formData.expertise_areas}
                      onChange={(value) => setFormData(prev => ({ ...prev, expertise_areas: value }))}
                      placeholder="Digite uma área e pressione Enter"
                      suggestions={expertiseAreasSuggestions}
                    />
                  </div>

                  <div>
                    <Label>Tópicos de Mentoria</Label>
                    <ChipInput
                      value={formData.topics}
                      onChange={(value) => setFormData(prev => ({ ...prev, topics: value }))}
                      placeholder="Digite um tópico e pressione Enter"
                      suggestions={topicsSuggestions}
                    />
                  </div>

                  <div>
                    <Label>Tags Inclusivas</Label>
                    <ChipInput
                      value={formData.inclusion_tags}
                      onChange={(value) => setFormData(prev => ({ ...prev, inclusion_tags: value }))}
                      placeholder="Digite uma tag e pressione Enter"
                      suggestions={inclusionTagsSuggestions}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mentorship_approach">Abordagem da Mentoria</Label>
                    <Textarea
                      id="mentorship_approach"
                      value={formData.mentorship_approach}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentorship_approach: e.target.value }))}
                      placeholder="Descreva sua abordagem como mentor..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="what_to_expect">O que Esperar</Label>
                    <Textarea
                      id="what_to_expect"
                      value={formData.what_to_expect}
                      onChange={(e) => setFormData(prev => ({ ...prev, what_to_expect: e.target.value }))}
                      placeholder="O que os mentorados podem esperar das sessões..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ideal_mentee">Mentee Ideal</Label>
                    <Textarea
                      id="ideal_mentee"
                      value={formData.ideal_mentee}
                      onChange={(e) => setFormData(prev => ({ ...prev, ideal_mentee: e.target.value }))}
                      placeholder="Descreva o perfil do mentorado ideal..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Mentorias Gratuitas:</strong> Todas as mentorias na plataforma são gratuitas e baseadas em voluntariado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end space-x-4">
              <Button
                type="submit"
                disabled={isUpdating}
                className="min-w-[120px]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Perfil"
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  )
}