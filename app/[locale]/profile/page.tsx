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
import { Camera, Globe, Linkedin, FileText, X, Loader2, Eye, Trash2, Target } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/useProfile"
import { useSimpleImageUpload, useSimplePDFUpload } from "@/hooks/useSimpleUpload"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
    (suggestion) =>
      suggestion &&
      inputValue &&
      value &&
      Array.isArray(value) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion),
  )

  const addChip = (chip: string) => {
    if (chip.trim() && value && Array.isArray(value) && !value.includes(chip.trim())) {
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
        {value && Array.isArray(value) && value.map((chip, index) => (
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
  const t = useTranslations("profile")
  const commonT = useTranslations("common")
  const { user, refreshProfile, role, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, isUpdating, updateProfile } = useProfile()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const isMentor = role === 'mentor'

  const imageUpload = useSimpleImageUpload('/api/upload/profile-photo')
  const cvUpload = useSimplePDFUpload('/api/upload/cv')

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    slug: "",
    bio: "",
    job_title: "",
    company: "",
    linkedin_url: "",
    portfolio_url: "",
    website_url: "",
    avatar_url: "",
    address: "",
    city: "",
    state: "",
    country: "",
    expertise_areas: [] as string[],
    mentorship_topics: [] as string[],
    free_topics: [] as string[],
    inclusive_tags: [] as string[],
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
    // Só redireciona se o carregamento da autenticação terminou e não há usuário
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        slug: profile.slug || "",
        bio: profile.bio || "",
        job_title: profile.job_title || "",
        company: profile.company || "",
        linkedin_url: profile.linkedin_url || "",
        portfolio_url: profile.portfolio_url || "",
        website_url: profile.website_url || "",
        avatar_url: profile.avatar_url || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        expertise_areas: profile.expertise_areas || [],
        mentorship_topics: profile.mentorship_topics || [],
        free_topics: profile.free_topics || [],
        inclusive_tags: profile.inclusive_tags || [],
        languages: profile.languages || ["Português"],
        mentorship_approach: profile.mentorship_approach || "",
        what_to_expect: profile.what_to_expect || "",
        ideal_mentee: profile.ideal_mentee || "",
        cv_url: profile.cv_url || "",
      })
    }
  }, [user, profile, authLoading, router])

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await imageUpload.upload(file)

    if (result.success) {
      const avatarUrl = result.data.url + '?t=' + Date.now()
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
      await refreshProfile()
      toast.success(t("uploadPhotoSuccess"))
    } else {
      toast.error(result.error || t("uploadPhotoError"))
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error(commonT("error"), { description: "Apenas arquivos PDF são permitidos" })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(commonT("error"), { description: "O arquivo deve ter no máximo 5MB" })
      return
    }

    const result = await cvUpload.upload(file)

    if (result.success) {
      const cvUrl = result.data.url;
      setFormData(prev => ({ ...prev, cv_url: cvUrl }))
      await refreshProfile()
      toast.success(t("form.cvSuccess"))
    } else {
      toast.error(result.error || t("uploadPhotoError"))
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
        toast.error(commonT("sessionExpired"))
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
        toast.success(t("form.cvRemoveSuccess"))
        await refreshProfile()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t("form.updateError"))
      }
    } catch (error) {
      console.error("Error removing CV:", error)
      toast.error(t("form.updateError"))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error(t("form.requiredFields"))
      return
    }

    const result = await updateProfile(formData)

    if (result.success) {
      toast.success(t("form.updateSuccess"))
    } else {
      toast.error(result.error || t("form.updateError"))
    }
  }

  if (authLoading || profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">{commonT("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-gray-600">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            {formData.slug && (
              <Button variant="outline" asChild size="sm">
                <Link href={`/mentors/${formData.slug}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("viewPublicProfile")}
                </Link>
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
              <TabsTrigger value="basic">{t("tabs.personal")}</TabsTrigger>
              <TabsTrigger value="professional">{t("tabs.professional")}</TabsTrigger>
              <TabsTrigger value="location">{t("form.address")}</TabsTrigger>
              {isMentor && (
                <TabsTrigger value="mentorship">{t("tabs.mentorship")}</TabsTrigger>
              )}
              <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tabs.personal")}</CardTitle>
                  <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo */}
                  <div>
                    <Label>{t("uploadPhoto")}</Label>
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
                              {commonT("loading")}
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              {t("uploadPhoto")}
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
                      <Label htmlFor="first_name">{t("form.firstName")} *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">{t("form.lastName")} *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slug">{t("form.slug")}</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="seu-nome-perfil"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">{t("form.bio")}</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder={t("form.bioPlaceholder")}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tabs.professional")}</CardTitle>
                  <CardDescription>{t("form.professionalDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_title">{t("form.jobTitle")}</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                        placeholder={t("form.jobTitlePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">{t("form.company")}</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder={t("form.companyPlaceholder")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="linkedin_url">{t("form.linkedin")}</Label>
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
                    <Label htmlFor="portfolio_url">{t("form.portfolio")}</Label>
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
                    <Label htmlFor="website_url">{t("form.website")}</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                        placeholder="https://seu-site.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("tabs.documents")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>{t("form.cvTitle")}</Label>
                    <p className="text-sm text-gray-500">
                      {t("form.cvDescription")}
                    </p>

                    {formData.cv_url && formData.cv_url.trim() !== "" ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">{t("form.cvSuccess")}</p>
                            <p className="text-sm text-green-600">{t("form.cvAvailable")}</p>
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
                            {t("form.viewCV")}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("form.removeCV")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{commonT("confirmTitle", { defaultValue: "Você tem certeza?" })}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {commonT("confirmDesc", { defaultValue: "Esta ação não pode ser desfeita. Isso removerá permanentemente seu currículo dos nossos servidores." })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCVRemove} className="bg-red-600 hover:bg-red-700">
                                  {commonT("confirmAction", { defaultValue: "Sim, remover" })}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-4">{commonT("selectPDF", { defaultValue: "Selecionar arquivo PDF" })}</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => cvInputRef.current?.click()}
                          disabled={cvUpload.isUploading}
                        >
                          {cvUpload.isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {commonT("loading")}
                            </>
                          ) : (
                            t("form.uploadCV")
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          {commonT("cvErrorSize", { defaultValue: "Apenas arquivos PDF são aceitos (máximo 5MB)" })}
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
                  <CardTitle>{t("form.address")}</CardTitle>
                  <CardDescription>
                    {t("form.locationDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="address">{t("form.address")}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={commonT("addressPlaceholder", { defaultValue: "Rua, número, complemento" })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">{t("form.city")}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Ex: São Paulo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">{t("form.state")}</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Ex: SP"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">{t("form.country")}</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Ex: Brasil"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentorship" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tabs.mentorship")}</CardTitle>
                  <CardDescription>
                    {t("form.mentorshipDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>{t("form.languages")}</Label>
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
                    <Label>{t("form.expertiseAreas")}</Label>
                    <ChipInput
                      value={formData.expertise_areas}
                      onChange={(value) => setFormData(prev => ({ ...prev, expertise_areas: value }))}
                      placeholder={t("form.expertisePlaceholder", { defaultValue: "Digite uma área e pressione Enter" })}
                      suggestions={expertiseAreasSuggestions}
                    />
                  </div>

                  <div>
                    <Label>{t("form.mentorshipTopics")}</Label>
                    <ChipInput
                      value={formData.mentorship_topics}
                      onChange={(value) => setFormData(prev => ({ ...prev, mentorship_topics: value }))}
                      placeholder={t("form.topicsPlaceholder", { defaultValue: "Digite um tópico e pressione Enter" })}
                      suggestions={topicsSuggestions}
                    />
                  </div>

                  <div>
                    <Label>{t("form.inclusiveTags")}</Label>
                    <ChipInput
                      value={formData.inclusive_tags}
                      onChange={(value) => setFormData(prev => ({ ...prev, inclusive_tags: value }))}
                      placeholder={t("form.tagsPlaceholder", { defaultValue: "Digite uma tag e pressione Enter" })}
                      suggestions={inclusionTagsSuggestions}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mentorship_approach">{t("form.mentorshipApproach")}</Label>
                    <Textarea
                      id="mentorship_approach"
                      value={formData.mentorship_approach}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentorship_approach: e.target.value }))}
                      placeholder={t("form.mentorshipApproachPlaceholder")}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="what_to_expect">{t("form.whatToExpect")}</Label>
                    <Textarea
                      id="what_to_expect"
                      value={formData.what_to_expect}
                      onChange={(e) => setFormData(prev => ({ ...prev, what_to_expect: e.target.value }))}
                      placeholder={t("form.whatToExpectPlaceholder")}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ideal_mentee">{t("form.idealMentee")}</Label>
                    <Textarea
                      id="ideal_mentee"
                      value={formData.ideal_mentee}
                      onChange={(e) => setFormData(prev => ({ ...prev, ideal_mentee: e.target.value }))}
                      placeholder={t("form.idealMenteePlaceholder")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tabs.settings")}</CardTitle>
                  <CardDescription>{t("form.settingsDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">{t("form.inDevelopment")}</h3>
                    <p className="text-sm max-w-md mx-auto">
                      {t("form.settingsComingSoon")}
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
                    {t("saving")}
                  </>
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  )
}