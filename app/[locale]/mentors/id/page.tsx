"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Briefcase,
  Calendar,
  Clock,
  Flag,
  GraduationCap,
  Heart,
  Linkedin,
  MapPin,
  MessageSquare,
  Share2,
  Star,
  User,
  CheckCircle,
  Shield,
  Languages,
  Award
} from "lucide-react"
import { useMentor } from "@/hooks/useMentors"
import { useAuth } from "@/lib/auth"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

interface MentorProfilePageProps {
  params: { id: string }
}

export default function MentorProfilePage({ params }: MentorProfilePageProps) {
  const t = useTranslations()
  const { user } = useAuth()
  const { data: mentor, isLoading, error } = useMentor(params.id)
  const [showLoginModal, setShowLoginModal] = useState(false)

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Shield className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("mentors.loginRequired.title")}</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-center">{t("mentors.loginRequired.descriptionWithName", { mentorName: "" })}</p>
        <div className="flex gap-4">
          <Button onClick={() => setShowLoginModal(true)}>{t("mentors.loginRequired.login")}</Button>
          <Button variant="outline" onClick={() => setShowLoginModal(true)}>{t("mentors.loginRequired.signUp")}</Button>
        </div>
        <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} mentorName={mentor ? `${mentor.first_name} ${mentor.last_name}` : ""} />
      </div>
    )
  }

  if (isLoading) return <MentorProfileSkeleton />
  if (error || !mentor) notFound()

  const handleAuthRequiredAction = (action: () => void) => {
    if (!user) { setShowLoginModal(true); return }
    action()
  }

  const handleScheduleSession = () => handleAuthRequiredAction(() => { window.location.href = `/mentors/${params.id}/schedule` })
  const handleSendMessage = () => handleAuthRequiredAction(() => { window.location.href = `/messages/new?mentor=${params.id}` })
  const handleSaveToFavorites = () => handleAuthRequiredAction(() => { toast.success("Mentor salvo nos favoritos!") })

  const handleShare = async () => {
    try {
      await navigator.share({ title: `${mentor.first_name} ${mentor.last_name} - Mentor na Menvo`, text: mentor.bio || "Conheça este mentor!", url: window.location.href })
    } catch (e) {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiado!")
    }
  }

  const formatExperience = () => {
    if (!mentor.years_experience) return null
    return `${mentor.years_experience} ${mentor.years_experience === 1 ? "ano" : "anos"} de experiência`
  }

  const getAvailabilityStatus = () => {
    switch (mentor.availability) {
      case "available": return { text: "Disponível", variant: "default" as const, icon: CheckCircle, color: "text-green-600" }
      case "busy": return { text: "Ocupado", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" }
      default: return { text: "Indisponível", variant: "outline" as const, icon: Clock, color: "text-gray-600" }
    }
  }

  const availabilityStatus = getAvailabilityStatus()

  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex-shrink-0">
              {mentor.avatar_url ? (
                <Image 
                  src={mentor.avatar_url} 
                  alt={mentor.full_name || `${mentor.first_name} ${mentor.last_name}`} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="h-16 w-16 text-primary/40" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-3xl font-bold">{mentor.first_name} {mentor.last_name}</h1>
                {mentor.verified && <Badge variant="outline" className="flex items-center gap-1 border-blue-200 text-blue-700"><Shield className="h-3 w-3" /> Verificado</Badge>}
              </div>
              <div className="flex flex-wrap gap-y-2 gap-x-4 text-muted-foreground text-sm">
                {mentor.current_position && <div className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> <span>{mentor.current_position} {mentor.current_company && ` na ${mentor.current_company}`}</span></div>}
                {mentor.location && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> <span>{mentor.location}</span></div>}
                {formatExperience() && <div className="flex items-center gap-1"><Award className="h-4 w-4" /> <span>{formatExperience()}</span></div>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={availabilityStatus.variant} className={availabilityStatus.color}><availabilityStatus.icon className="h-3 w-3 mr-1" /> {availabilityStatus.text}</Badge>
                {(mentor.mentor_skills || []).slice(0, 3).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleScheduleSession} className="gap-2"><Calendar className="h-4 w-4" /> Agendar Sessão</Button>
            <Button variant="outline" onClick={handleSendMessage} className="gap-2"><MessageSquare className="h-4 w-4" /> Enviar Mensagem</Button>
            <Button variant="ghost" size="icon" onClick={handleSaveToFavorites}><Heart className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={handleShare}><Share2 className="h-5 w-5" /></Button>
          </div>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-auto"><TabsTrigger value="about">Sobre</TabsTrigger><TabsTrigger value="expertise">Especialidades</TabsTrigger><TabsTrigger value="availability">Disponibilidade</TabsTrigger></TabsList>
            <TabsContent value="about" className="space-y-6 pt-4">
              {mentor.bio && <div><h2 className="text-xl font-semibold mb-3">Sobre</h2><p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{mentor.bio}</p></div>}
            </TabsContent>
            <TabsContent value="expertise" className="pt-4">
              <div className="flex flex-wrap gap-2">{(mentor.mentor_skills || []).map((s: string) => <Badge key={s} variant="secondary" className="text-sm py-1 px-3">{s}</Badge>)}</div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Agendar Sessão</CardTitle><CardDescription>Reserve uma sessão gratuita de 45 min</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Preço</span><span className="font-medium text-green-600">Gratuito</span></div>
              <Button onClick={handleScheduleSession} disabled={mentor.availability !== "available"} className="w-full">{mentor.availability === "available" ? "Ver Horários" : "Indisponível"}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} mentorName={`${mentor.first_name} ${mentor.last_name}`} />
    </div>
  )
}

function MentorProfileSkeleton() { return <div className="container py-12"><Skeleton className="h-32 w-32 rounded-full mb-8" /><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-32 w-full" /></div> }
