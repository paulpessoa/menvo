"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Camera, MapPin, Globe, Linkedin, FileText, Upload, X, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { GoogleMapsService } from "@/services/maps/googleMaps"
import { supabase } from "@/lib/supabase"

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
  const { user } = useAuth()
  const { profile, loading, updateProfile } = useProfile()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    slug: "",
    bio: "",
    current_position: "",
    current_company: "",
    linkedin_url: "",
    portfolio_url: "",
    personal_website_url: "",
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: null as number | null,
    longitude: null as number | null,
    avatar_url: "",
    // Mentor specific fields
    expertise_areas: [] as string[],
    topics: [] as string[],
    inclusion_tags: [] as string[],
    languages: ["Português"] as string[],
    mentorship_approach: "",
    what_to_expect: "",
    ideal_mentee: "",
    cv_url: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)

  // Suggestions for chips (these would come from your database)
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
    if (!user) {
      router.push("/login")
      return
    }

    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        full_name: profile.full_name || "",
        slug: profile.slug || "",
        bio: profile.bio || "",
        current_position: profile.current_position || "",
        current_company: profile.current_company || "",
        linkedin_url: profile.linkedin_url || "",
        portfolio_url: profile.portfolio_url || "",
        personal_website_url: profile.personal_website_url || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        avatar_url: profile.avatar_url || "",
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

  const handleAddressSearch = async (address: string) => {
    if (address.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      const results = await GoogleMapsService.geocode(address)
      setAddressSuggestions(results.slice(0, 5))
      setShowAddressSuggestions(true)
    } catch (error) {
      console.error("Error searching address:", error)
    }
  }

  const handleAddressSelect = (result: any) => {
    const components = GoogleMapsService.extractAddressComponents(result)

    setFormData((prev) => ({
      ...prev,
      address: result.formatted_address,
      city: components.city,
      state: components.state,
      country: components.country,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    }))

    setShowAddressSuggestions(false)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsLoading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profile-photos").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }))
      setSuccess("Foto de perfil atualizada com sucesso!")
    } catch (error) {
      console.error("Error uploading photo:", error)
      setError("Erro ao fazer upload da foto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await updateProfile(formData)
      setSuccess("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Erro ao atualizar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevelopmentFeature = (feature: string) => {
    alert(`${feature} - Ferramenta em desenvolvimento`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

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
                        disabled={isLoading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Alterar Foto
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nome</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug do Perfil</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="seu-nome-unico"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Seu perfil será acessível em: menvo.com.br/perfil/{formData.slug}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, current_position: e.target.value }))}
                        placeholder="Ex: Desenvolvedor Senior"
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_company">Empresa Atual</Label>
                      <Input
                        id="current_company"
                        value={formData.current_company}
                        onChange={(e) => setFormData((prev) => ({ ...prev, current_company: e.target.value }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, portfolio_url: e.target.value }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, personal_website_url: e.target.value }))}
                        placeholder="https://seu-site.com"
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
                        onClick={() => handleDevelopmentFeature("Upload de Currículo")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir CV (PDF)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDevelopmentFeature("Autopreencher com LinkedIn")}
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDevelopmentFeature("Autopreencher com Lattes")}
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
                  <div className="relative">
                    <Label htmlFor="address">Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, address: e.target.value }))
                          handleAddressSearch(e.target.value)
                        }}
                        placeholder="Digite seu endereço..."
                        className="pl-10"
                      />
                    </div>
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleAddressSelect(suggestion)}
                          >
                            {suggestion.formatted_address}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="Sua cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="Seu estado"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                        placeholder="Seu país"
                      />
                    </div>
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
                  <div>
                    <Label>Idiomas</Label>
                    <Select
                      value={formData.languages[0]}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, languages: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Português">Português</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Español">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Áreas de Expertise</Label>
                    <ChipInput
                      value={formData.expertise_areas}
                      onChange={(value) => setFormData((prev) => ({ ...prev, expertise_areas: value }))}
                      placeholder="Digite uma área de expertise e pressione Enter"
                      suggestions={expertiseAreasSuggestions}
                    />
                  </div>

                  <div>
                    <Label>Tópicos de Mentoria</Label>
                    <ChipInput
                      value={formData.topics}
                      onChange={(value) => setFormData((prev) => ({ ...prev, topics: value }))}
                      placeholder="Digite um tópico e pressione Enter"
                      suggestions={topicsSuggestions}
                    />
                  </div>

                  <div>
                    <Label>Tags Inclusivas</Label>
                    <ChipInput
                      value={formData.inclusion_tags}
                      onChange={(value) => setFormData((prev) => ({ ...prev, inclusion_tags: value }))}
                      placeholder="Digite uma tag inclusiva e pressione Enter"
                      suggestions={inclusionTagsSuggestions}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mentorship_approach">Abordagem da Mentoria</Label>
                    <Textarea
                      id="mentorship_approach"
                      value={formData.mentorship_approach}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mentorship_approach: e.target.value }))}
                      placeholder="Descreva sua abordagem como mentor..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="what_to_expect">O que Esperar</Label>
                    <Textarea
                      id="what_to_expect"
                      value={formData.what_to_expect}
                      onChange={(e) => setFormData((prev) => ({ ...prev, what_to_expect: e.target.value }))}
                      placeholder="O que os mentorados podem esperar das suas sessões..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ideal_mentee">Mentee Ideal</Label>
                    <Textarea
                      id="ideal_mentee"
                      value={formData.ideal_mentee}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ideal_mentee: e.target.value }))}
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
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
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
