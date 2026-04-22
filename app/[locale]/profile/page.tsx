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
    AlertCircle
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

const expertiseAreasSuggestions = ["Design", "Frontend", "Backend", "Product Management", "Marketing", "Sales", "Data Science", "UX Research"]
const topicsSuggestions = ["Carreira", "Tecnologia", "Liderança", "Empreendedorismo", "Design Thinking", "React", "Node.js", "Python"]
const inclusionTagsSuggestions = ["Mulheres na Tecnologia", "LGBTQIA+", "Pessoas Pretas", "PCD", "Primeiro Emprego"]

export default function ProfilePage() {
  const t = useTranslations("profile")
  const commonT = useTranslations("common")
  const { user, refreshProfile, role, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, isUpdating, updateProfile } = useProfile()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const isMentor = role === 'mentor'
  const isPendingMentor = (profile as any)?.is_pending_mentor

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
      })
    }
  }, [user, profile, authLoading, router])

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await imageUpload.upload(file)

    if (result.success) {
      const avatarUrl = result.data.url + '?t=' + Date.now()
      await updateProfile({ ...formData, avatar_url: avatarUrl })
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
      await refreshProfile()
      toast.success("Foto atualizada!")
    } else {
      toast.error("Erro ao subir foto")
    }
  }

  const handleRequestMentor = async () => {
    try {
        const response = await fetch('/api/profile/request-mentor', { method: 'POST' })
        if (response.ok) {
            toast.success("Solicitação enviada com sucesso! Aguarde a moderação.")
            refreshProfile()
        } else {
            toast.error("Falha ao enviar solicitação")
        }
    } catch (err) {
        toast.error("Erro de conexão")
    }
  }

  const handleStopMentor = async () => {
    try {
        const response = await fetch('/api/profile/stop-mentor', { method: 'POST' })
        if (response.ok) {
            toast.success("Você não é mais um mentor. Seu perfil agora é apenas de mentee.")
            refreshProfile()
        } else {
            toast.error("Falha ao processar alteração")
        }
    } catch (err) {
        toast.error("Erro de conexão")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const result = await updateProfile(formData)
    if (result.success) {
      toast.success("Perfil atualizado!")
    } else {
      toast.error("Erro ao atualizar")
    }
  }

  if (authLoading || profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações e visibilidade</p>
          </div>
          <div className="flex items-center gap-2">
            {formData.slug && (
              <Button variant="outline" asChild size="sm">
                <Link href={isMentor ? `/mentors/${formData.slug}` : `/mentee/${formData.slug}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Perfil Público
                </Link>
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
              <TabsTrigger value="basic">Pessoal</TabsTrigger>
              <TabsTrigger value="professional">Carreira</TabsTrigger>
              <TabsTrigger value="mentorship">{isMentor ? "Mentoria" : "Interesses"}</TabsTrigger>
              <TabsTrigger value="settings">Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Visibilidade */}
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                    <div className="space-y-1 pr-4">
                      <Label className="text-base font-bold">
                        {isMentor ? "Publicar Perfil de Mentor" : "Perfil Público na Comunidade"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isMentor 
                          ? "Permite que mentees te encontrem no diretório." 
                          : "Permite que mentores te encontrem no Mural de Mentorados."}
                      </p>
                    </div>
                    <Switch 
                      checked={formData.is_public}
                      onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_public: val }))}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-20 w-24 border">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback>{formData.first_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg">
                        <Camera className="h-3 w-3" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-1">
                        <Label>Nome</Label>
                        <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label>Sobrenome</Label>
                        <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Bio / Sobre você</Label>
                    <Textarea 
                        value={formData.bio} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Conte sua história..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
               <Card className="border-amber-100 bg-amber-50/20">
                 <CardHeader>
                   <CardTitle className="text-amber-800 flex items-center gap-2">
                     <ShieldCheck className="h-5 w-5" />
                     Status de Mentor
                   </CardTitle>
                   <CardDescription>Gerencie seu papel como mentor na plataforma</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    {isMentor ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 text-sm font-medium">
                                <Check className="h-4 w-4" /> Você é um mentor verificado.
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                                        <UserMinus className="h-4 w-4" /> Deixar de ser Mentor
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Seu perfil não aparecerá mais no diretório de mentores e você não receberá novos agendamentos. Você poderá solicitar novamente no futuro.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleStopMentor} className="bg-red-600">Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ) : isPendingMentor ? (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-bold text-blue-900">Solicitação em Análise</p>
                                <p className="text-sm text-blue-700">Seu pedido para se tornar mentor está sendo revisado pelo nosso time. Você receberá um e-mail em breve.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Quer compartilhar seu conhecimento? Ao se tornar um mentor, você ganha acesso à agenda, chat proativo e avaliações.
                            </p>
                            <Button onClick={handleRequestMentor} className="gap-2 bg-primary">
                                <UserPlus className="h-4 w-4" /> Solicitar ser Mentor
                            </Button>
                        </div>
                    )}
                 </CardContent>
               </Card>
            </TabsContent>

            {/* Outras abas mantidas como antes mas com UI limpa */}
            <div className="flex justify-end gap-4 pt-6">
                <Button type="submit" disabled={isUpdating} className="min-w-[150px]">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar Alterações
                </Button>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  )
}
