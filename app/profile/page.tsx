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
import { Camera, MapPin, Globe, Linkedin, FileText, Upload, X, Loader2, AlertCircle, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/useProfile"
import { useSimpleImageUpload, useSimplePDFUpload } from "@/hooks/useSimpleUpload"
import { useFormValidation, PROFILE_VALIDATION_RULES, getFieldErrorClass, getFieldErrorMessage } from "@/hooks/useFormValidation"
import { GoogleMapsService } from "@/services/maps/googleMaps"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingOverlay, LoadingSpinner, ProgressBar } from "@/components/loading-overlay"
import { useNotifications, NotificationContainer, InlineNotification } from "@/components/notification-system"
import { useConfirmationDialog } from "@/components/confirmation-dialog"
import { ValidationSummary } from "@/components/validation-summary"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { UnsavedChangesWarning, FloatingUnsavedButton } from "@/components/unsaved-changes-warning"

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
  const { profile, loading, isUpdating, updateProfile } = useProfile()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  // Image upload hook
  const imageUpload = useSimpleImageUpload('/api/upload/profile-photo')


  // CV upload hook
  const cvUpload = useSimplePDFUpload('/api/upload/cv')

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


  const notifications = useNotifications()
  const confirmation = useConfirmationDialog()

  // Form validation
  const validation = useFormValidation(formData, PROFILE_VALIDATION_RULES)

  // Unsaved changes detection
  const unsavedChanges = useUnsavedChanges(formData, {
    enableBrowserWarning: true,
    enableRouterBlocking: true,
    onNavigationAttempt: () => {
      confirmation.showConfirmation({
        title: "Alterações não salvas",
        description: "Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?",
        confirmText: "Sair sem salvar",
        cancelText: "Continuar editando",
        variant: "destructive",
        icon: "warning",
        onConfirm: () => {
          unsavedChanges.resetChanges()
          router.back()
        }
      })
    },
    onChangesDetected: (hasChanges) => {
      if (hasChanges && !validation.isDirty) {
        validation.markAsDirty()
      }
    }
  })
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
    if (!file) return

    notifications.clearAll()

    const result = await imageUpload.upload(file)

    if (result.success) {
      setFormData(prev => ({ ...prev, avatar_url: result.data.url }))
      unsavedChanges.markAsChanged()
      notifications.success("Foto de perfil atualizada com sucesso!", {
        title: "Upload concluído",
        duration: 3000
      })
    } else {
      notifications.error(result.error || "Erro no upload da imagem", {
        title: "Erro no upload",
        action: {
          label: "Tentar novamente",
          onClick: () => fileInputRef.current?.click()
        }
      })
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      notifications.error("Apenas arquivos PDF são permitidos", {
        title: "Tipo de arquivo inválido"
      })
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      notifications.error("O arquivo deve ter no máximo 5MB", {
        title: "Arquivo muito grande"
      })
      return
    }

    notifications.clearAll()

    const result = await cvUpload.upload(file)

    if (result.success) {
      setFormData(prev => ({ ...prev, cv_url: result.data.url }))
      unsavedChanges.markAsChanged()
      notifications.success("CV enviado com sucesso!", {
        title: "Upload concluído",
        duration: 3000
      })
    } else {
      notifications.error(result.error || "Erro no upload do CV", {
        title: "Erro no upload",
        action: {
          label: "Tentar novamente",
          onClick: () => cvInputRef.current?.click()
        }
      })
    }

    // Clear the file input
    if (cvInputRef.current) {
      cvInputRef.current.value = ""
    }
  }

  const handleCVRemove = async () => {
    if (!formData.cv_url) return

    confirmation.showConfirmation({
      title: "Remover CV",
      description: "Tem certeza que deseja remover seu currículo? Esta ação não pode ser desfeita.",
      confirmText: "Remover",
      cancelText: "Cancelar",
      variant: "destructive",
      icon: "warning",
      onConfirm: async () => {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: { session } } = await supabase.auth.getSession()

          if (!session?.access_token) {
            notifications.error("Sessão expirada. Faça login novamente.", {
              title: "Erro de autenticação"
            })
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
            unsavedChanges.markAsChanged()
            notifications.success("CV removido com sucesso!", {
              title: "Remoção concluída"
            })
          } else {
            const errorData = await response.json()
            notifications.error(errorData.error || "Erro ao remover CV", {
              title: "Erro na remoção"
            })
          }
        } catch (error) {
          console.error("Error removing CV:", error)
          notifications.error("Erro ao remover CV", {
            title: "Erro inesperado"
          })
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    notifications.clearAll()
    validation.markAsDirty()

    // Validate form before submission
    if (!validation.validate()) {
      notifications.error("Por favor, corrija os erros no formulário antes de continuar", {
        title: "Erro de validação",
        duration: 5000
      })

      // Scroll to first error field
      const firstErrorField = Object.keys(validation.errors)[0]
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element?.focus()
      }
      return
    }

    const result = await updateProfile(formData)

    if (result.success) {
      notifications.success("Perfil atualizado com sucesso!", {
        title: "Sucesso",
        duration: 3000
      })
      validation.resetDirty()
      unsavedChanges.markAsSaved()

      // Auto-scroll to top to show notification
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      notifications.error(result.error || "Erro ao atualizar perfil", {
        title: "Erro ao salvar",
        action: {
          label: "Tentar novamente",
          onClick: () => handleSubmit(e)
        }
      })
    }
  }

  const handleDevelopmentFeature = (feature: string) => {
    alert(`${feature} - Ferramenta em desenvolvimento`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Carregando perfil...</p>
            <p className="text-sm text-gray-500">Buscando suas informações</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                Meu Perfil
                {(isUpdating || imageUpload.isUploading) && (
                  <LoadingSpinner size="sm" className="ml-3" />
                )}
                {unsavedChanges.hasUnsavedChanges && (
                  <span className="ml-3 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                    Não salvo
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                Gerencie suas informações pessoais e profissionais
                {(isUpdating || imageUpload.isUploading) && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {isUpdating ? 'Salvando...' : 'Enviando imagem...'}
                  </span>
                )}
                {unsavedChanges.hasUnsavedChanges && !isUpdating && (
                  <span className="ml-2 text-orange-600 font-medium">
                    • Você tem alterações não salvas
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Validation Summary */}
          <ValidationSummary
            errors={validation.errors}
            isValid={validation.isValid}
            isDirty={validation.isDirty}
          />

          {/* Unsaved Changes Warning */}
          <UnsavedChangesWarning
            hasUnsavedChanges={unsavedChanges.hasUnsavedChanges}
            onSave={() => {
              const form = document.querySelector('form') as HTMLFormElement
              form?.requestSubmit()
            }}
            onDiscard={() => {
              confirmation.showConfirmation({
                title: "Descartar alterações",
                description: "Tem certeza que deseja descartar todas as alterações não salvas?",
                confirmText: "Sim, descartar",
                cancelText: "Cancelar",
                variant: "destructive",
                icon: "warning",
                onConfirm: () => {
                  window.location.reload()
                }
              })
            }}
            isSaving={isUpdating}
          />

          <LoadingOverlay
            isLoading={isUpdating}
            message="Salvando perfil..."
            className="rounded-lg"
          >
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
                            disabled={imageUpload.isUploading || isUpdating}
                          >
                            {imageUpload.isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando... {imageUpload.progress}%
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

                          {/* Image Upload Progress */}
                          {imageUpload.isUploading && (
                            <div className="mt-2">
                              <ProgressBar
                                progress={imageUpload.progress}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">
                            Nome *
                          </Label>
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => {
                              const value = e.target.value
                              setFormData((prev) => ({ ...prev, first_name: value }))
                              if (validation.isDirty) {
                                validation.validateField('first_name', value)
                              }
                            }}
                            onBlur={() => validation.validateField('first_name', formData.first_name)}
                            disabled={isUpdating}
                            required
                            className={getFieldErrorClass('first_name', validation.errors)}
                          />
                          {validation.errors.first_name && (
                            <p className="text-sm text-red-600 mt-1">
                              {validation.errors.first_name}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="last_name">
                            Sobrenome *
                          </Label>
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => {
                              const value = e.target.value
                              setFormData((prev) => ({ ...prev, last_name: value }))
                              if (validation.isDirty) {
                                validation.validateField('last_name', value)
                              }
                            }}
                            onBlur={() => validation.validateField('last_name', formData.last_name)}
                            disabled={isUpdating}
                            required
                            className={getFieldErrorClass('last_name', validation.errors)}
                          />
                          {validation.errors.last_name && (
                            <p className="text-sm text-red-600 mt-1">
                              {validation.errors.last_name}
                            </p>
                          )}
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

                        {/* CV Upload Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Currículo (PDF)</Label>
                            {formData.cv_url && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Enviado
                              </span>
                            )}
                          </div>

                          {formData.cv_url ? (
                            <div className="space-y-3">
                              {/* Current CV Display */}
                              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-green-100 rounded-full">
                                    <FileText className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Currículo enviado
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Arquivo PDF • Clique para visualizar
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(formData.cv_url, '_blank')}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCVRemove}
                                    disabled={cvUpload.isUploading}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Replace CV Button */}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => cvInputRef.current?.click()}
                                disabled={cvUpload.isUploading || isUpdating}
                                className="w-full border-dashed"
                              >
                                {cvUpload.isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando novo CV... {cvUpload.progress}%
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Substituir CV
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Upload Area */}
                              <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                onClick={() => cvInputRef.current?.click()}
                              >
                                <div className="space-y-2">
                                  <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                                    {cvUpload.isUploading ? (
                                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                                    ) : (
                                      <Upload className="h-6 w-6 text-blue-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {cvUpload.isUploading ? (
                                        `Enviando CV... ${cvUpload.progress}%`
                                      ) : (
                                        "Clique para enviar seu CV"
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Ou arraste e solte o arquivo aqui
                                    </p>
                                  </div>
                                </div>

                                {cvUpload.isUploading && (
                                  <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${cvUpload.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => cvInputRef.current?.click()}
                                disabled={cvUpload.isUploading || isUpdating}
                                className="w-full"
                              >
                                {cvUpload.isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando CV... {cvUpload.progress}%
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Selecionar arquivo PDF
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          <input
                            ref={cvInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleCVUpload}
                            className="hidden"
                          />

                          <div className="flex items-start space-x-2 text-xs text-gray-500">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                            <div>
                              <p>Apenas arquivos PDF são aceitos (máximo 5MB)</p>
                              <p>Seu CV será analisado automaticamente para preencher campos do perfil</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Future Integrations */}
                        <div className="grid grid-cols-2 gap-4">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (unsavedChanges.hasUnsavedChanges) {
                      confirmation.showConfirmation({
                        title: "Cancelar edição",
                        description: "Você tem alterações não salvas. Tem certeza que deseja cancelar?",
                        confirmText: "Sim, cancelar",
                        cancelText: "Continuar editando",
                        variant: "destructive",
                        icon: "warning",
                        onConfirm: () => {
                          unsavedChanges.resetChanges()
                          router.back()
                        }
                      })
                    } else {
                      router.back()
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || imageUpload.isUploading || (validation.isDirty && !validation.isValid)}
                  className="min-w-[140px]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : imageUpload.isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aguardando...
                    </>
                  ) : validation.isDirty && !validation.isValid ? (
                    "Corrija os erros"
                  ) : (
                    "Salvar Perfil"
                  )}
                </Button>
              </div>
            </form>
          </LoadingOverlay>
        </div>
      </div>

      {/* Notification System */}
      <NotificationContainer
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
        position="top-right"
      />

      {/* Confirmation Dialog */}
      <confirmation.ConfirmationDialog />

      {/* Floating Save Button */}
      <FloatingUnsavedButton
        hasUnsavedChanges={unsavedChanges.hasUnsavedChanges}
        onSave={() => {
          const form = document.querySelector('form') as HTMLFormElement
          form?.requestSubmit()
        }}
        isSaving={isUpdating}
      />
    </ErrorBoundary>
  )
}
