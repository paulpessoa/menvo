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
import { 
    Camera, 
    Globe, 
    Linkedin, 
    FileText, 
    X, 
    Loader2, 
    Eye, 
    Trash2, 
    Check, 
    ShieldCheck, 
    UserPlus,
    UserMinus,
    AlertCircle,
    MapPin,
    GraduationCap,
    Target,
    BookOpen,
    Sparkles
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/useProfile"
import { useSimpleImageUpload, useSimplePDFUpload } from "@/hooks/useSimpleUpload"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Link } from "@/i18n/routing"
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
import { Switch } from "@/components/ui/switch"

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}

function ChipInput({ value, onChange, placeholder }: ChipInputProps) {
  const [inputValue, setInputValue] = useState("")
  const addChip = (chip: string) => {
    if (chip.trim() && !value.includes(chip.trim())) {
      onChange([...value, chip.trim()])
      setInputValue("")
    }
  }
  const removeChip = (index: number) => onChange(value.filter((_, i) => i !== index))
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((chip, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {chip} <X className="h-3 w-3 cursor-pointer" onClick={() => removeChip(index)} />
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(inputValue) } }}
        placeholder={placeholder}
      />
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
  const isPendingMentor = profile?.is_pending_mentor

  const imageUpload = useSimpleImageUpload('/api/upload/profile-photo')
  const cvUpload = useSimplePDFUpload('/api/upload/cv')

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    slug: "",
    bio: "",
    job_title: "",
    company: "",
    institution: "",
    course: "",
    academic_level: "",
    expected_graduation: "",
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
    inclusive_tags: [] as string[],
    languages: ["Português"] as string[],
    mentorship_approach: "",
    what_to_expect: "",
    ideal_mentee: "",
    cv_url: "",
    is_public: false,
    learning_goals: "",
  })

  useEffect(() => {
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
        institution: (profile as any).institution || "",
        course: (profile as any).course || "",
        academic_level: (profile as any).academic_level || "",
        expected_graduation: (profile as any).expected_graduation || "",
        expertise_areas: profile.expertise_areas || [],
        mentorship_topics: profile.mentorship_topics || [],
        inclusive_tags: profile.inclusive_tags || [],
        languages: profile.languages || ["Português"],
        mentorship_approach: profile.mentorship_approach || "",
        what_to_expect: profile.what_to_expect || "",
        ideal_mentee: profile.ideal_mentee || "",
        cv_url: profile.cv_url || "",
        is_public: profile.is_public || false,
        learning_goals: (profile as any).learning_goals || "",
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
      toast.success("Foto atualizada!")
    }
  }

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = await cvUpload.upload(file)
    if (result.success) {
      setFormData(prev => ({ ...prev, cv_url: result.data.url }))
      toast.success("Currículo atualizado!")
    }
  }

  const handleRequestMentor = async () => {
    try {
        const response = await fetch('/api/profile/request-mentor', { method: 'POST' })
        if (response.ok) {
            toast.success("Solicitação enviada!")
            refreshProfile()
        }
    } catch (err) { toast.error("Erro ao solicitar") }
  }

  const handleStopMentor = async () => {
    try {
        const response = await fetch('/api/profile/stop-mentor', { method: 'POST' })
        if (response.ok) {
            toast.success("Você agora é apenas Mentee.")
            refreshProfile()
        }
    } catch (err) { toast.error("Erro ao processar") }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await updateProfile(formData)
    if (result.success) toast.success("Perfil salvo com sucesso!")
    else toast.error("Erro ao salvar perfil")
  }

  if (authLoading || profileLoading || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Complete seu perfil para ser encontrado e ajudar/receber ajuda.</p>
          </div>
          {formData.slug && (
            <Button variant="outline" asChild size="sm">
              <Link href={isMentor ? `/mentors/${formData.slug}` : `/mentee/${formData.slug}`}>
                <Eye className="h-4 w-4 mr-2" /> Ver Perfil Público
              </Link>
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="basic" className="py-2">Pessoal</TabsTrigger>
              <TabsTrigger value="career" className="py-2">Carreira</TabsTrigger>
              <TabsTrigger value="address" className="py-2">Endereço</TabsTrigger>
              <TabsTrigger value="interests" className="py-2">Interesses</TabsTrigger>
              <TabsTrigger value="mentorship" className="py-2">Mentoria</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                    <div className="space-y-1 pr-4">
                      <Label className="text-base font-bold">Visibilidade Pública</Label>
                      <p className="text-xs text-muted-foreground">
                        {isMentor ? "Ative para aparecer no diretório de Mentores." : "Ative para aparecer no Mural de Mentorados."}
                      </p>
                    </div>
                    <Switch checked={formData.is_public} onCheckedChange={(v) => setFormData({...formData, is_public: v})} />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback>{formData.first_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg"><Camera className="h-4 w-4" /></button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                      <div className="space-y-1"><Label>Nome</Label><Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} /></div>
                      <div className="space-y-1"><Label>Sobrenome</Label><Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} /></div>
                      <div className="space-y-1 sm:col-span-2"><Label>Slug do Perfil</Label><Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} /></div>
                    </div>
                  </div>
                  <div className="space-y-1"><Label>Bio / Mini-currículo</Label><Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} placeholder="Conte sua história e o que te motiva..." /></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="career" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Experiência e Formação</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Cargo Atual</Label><Input value={formData.job_title} onChange={(e) => setFormData({...formData, job_title: e.target.value})} /></div>
                    <div className="space-y-1"><Label>Empresa</Label><Input value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} /></div>
                    <div className="space-y-1"><Label>Linkedin</Label><Input value={formData.linkedin_url} onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})} placeholder="https://..." /></div>
                    <div className="space-y-1"><Label>Portfolio / GitHub</Label><Input value={formData.portfolio_url} onChange={(e) => setFormData({...formData, portfolio_url: e.target.value})} /></div>
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Educação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label>Instituição</Label><Input value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Curso</Label><Input value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Nível</Label><Input value={formData.academic_level} onChange={(e) => setFormData({...formData, academic_level: e.target.value})} placeholder="Ex: Graduação, Técnico..." /></div>
                        <div className="space-y-1"><Label>Previsão de Conclusão</Label><Input value={formData.expected_graduation} onChange={(e) => setFormData({...formData, expected_graduation: e.target.value})} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1"><Label>Endereço</Label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1"><Label>Cidade</Label><Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Estado</Label><Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} /></div>
                        <div className="space-y-1"><Label>País</Label><Input value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} /></div>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interests" className="space-y-6">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Interesses e Habilidades</CardTitle>
                  <CardDescription>O que você já sabe e o que busca aprender (útil para todos os usuários)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label>Minhas Especialidades (O que eu já domino)</Label>
                        <ChipInput value={formData.expertise_areas} onChange={(v) => setFormData({...formData, expertise_areas: v})} placeholder="Ex: UX Design, React, Vendas..." />
                    </div>
                    <div className="space-y-3">
                        <Label>O que desejo aprender (Tópicos de interesse)</Label>
                        <ChipInput value={formData.mentorship_topics} onChange={(v) => setFormData({...formData, mentorship_topics: v})} placeholder="Ex: Gestão de Projetos, Node.js..." />
                    </div>
                    <div className="space-y-1">
                        <Label>Objetivos de Aprendizado</Label>
                        <Textarea value={formData.learning_goals} onChange={(e) => setFormData({...formData, learning_goals: e.target.value})} placeholder="Descreva brevemente o que você busca alcançar com a mentoria..." />
                    </div>
                    <div className="pt-4 border-t">
                        <Label>Currículo / Apresentação (PDF)</Label>
                        <div className="mt-2 flex items-center gap-4">
                            {formData.cv_url && (
                                <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-medium">PDF Carregado</span>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(formData.cv_url, '_blank')}><Eye className="h-3 w-3" /></Button>
                                </div>
                            )}
                            <Button type="button" variant="outline" size="sm" onClick={() => cvInputRef.current?.click()} disabled={cvUpload.isUploading}>
                                {cvUpload.isUploading ? "Subindo..." : "Upload de CV"}
                            </Button>
                            <input ref={cvInputRef} type="file" accept=".pdf" onChange={handleCVUpload} className="hidden" />
                        </div>
                    </div>
                </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="mentorship" className="space-y-6">
               <Card className="border-amber-100 bg-amber-50/30">
                 <CardHeader className="pb-3">
                   <CardTitle className="text-amber-800 flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" /> {t("form.mentorshipStatus")}</CardTitle>
                 </CardHeader>
                 <CardContent>
                    {isMentor ? (
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-green-700 flex items-center gap-2"><Check className="h-4 w-4" /> {t("form.activeMentor")}</p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 gap-2"><UserMinus className="h-4 w-4" /> {t("form.stopMentorButton")}</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t("form.stopMentorTitle")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t("form.stopMentorDescription")}
                                            <span className="block mt-2 font-bold text-red-600">{t("form.stopMentorWarning")}</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleStopMentor} className="bg-red-600">{t("form.stopMentorConfirm")}</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ) : isPendingMentor ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <div className="space-y-1">
                                    <p className="text-sm text-blue-700 font-medium">{t("form.pendingAnalysis")}</p>
                                    <p className="text-xs text-blue-600">{t("form.pendingAnalysisSubtitle")}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground flex-1">{t("form.becomeMentorPrompt")}</p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" className="gap-2 shrink-0"><UserPlus className="h-4 w-4" /> {t("form.becomeMentorButton")}</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t("form.becomeMentorTitle")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <span className="block mb-2">{t("form.becomeMentorDescription")}</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t("form.becomeMentorCancel")}</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRequestMentor}>{t("form.becomeMentorAction")}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                 </CardContent>
               </Card>

               {(isMentor || isPendingMentor) && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{t("form.mentorshipApproachTitle")}</CardTitle>
                        <CardDescription>{t("form.mentorshipApproachDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>{t("form.mentorshipApproachLabel")}</Label>
                            <Textarea 
                                value={formData.mentorship_approach} 
                                onChange={(e) => setFormData({...formData, mentorship_approach: e.target.value})} 
                                placeholder={t("form.mentorshipApproachPlaceholder")} 
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("form.whatToExpectLabel")}</Label>
                            <Textarea 
                                value={formData.what_to_expect} 
                                onChange={(e) => setFormData({...formData, what_to_expect: e.target.value})} 
                                placeholder={t("form.whatToExpectPlaceholder")} 
                            />
                        </div>
                    </CardContent>
                 </Card>
               )}
            </TabsContent>

            <div className="flex justify-end gap-4 pt-6 border-t">
                <Button type="submit" disabled={isUpdating} className="min-w-[150px] shadow-lg shadow-primary/20">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Salvar Perfil
                </Button>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  )
}
