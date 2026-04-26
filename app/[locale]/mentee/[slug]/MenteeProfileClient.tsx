"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PdfViewerDialog } from "@/components/ui/pdf-viewer-dialog"
import {
  MapPin,
  Mail,
  Calendar,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Target,
  FileText,
  User,
  Languages,
  MessageCircle,
  Sparkles,
  BookOpen,
  Quote,
  Eye,
  Github,
  Linkedin,
  Globe
} from "lucide-react"
import { Link, useRouter } from "@/i18n/routing"
import { useAuth } from "@/lib/auth"

interface MenteeProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  city?: string
  state?: string
  country?: string
  bio?: string
  job_title?: string
  company?: string
  institution?: string
  course?: string
  academic_level?: string
  expected_graduation?: string
  career_goals?: string
  expertise_areas?: string[]
  mentorship_topics?: string[]
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  cv_url?: string
  languages?: string[]
  created_at: string
}

interface Props {
  mentee: MenteeProfile
}

export default function MenteeProfileClient({ mentee }: Props) {
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false)
  const { user, profile: currentUserProfile } = useAuth()
  const router = useRouter()

  const isMentor = currentUserProfile?.roles?.includes("mentor") || false
  const isOwner = user?.id === mentee.id

  const fullName = `${mentee.first_name} ${mentee.last_name}`.trim()
  const initials =
    `${mentee.first_name?.[0] || ""}${mentee.last_name?.[0] || ""}`.toUpperCase()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    })
  }

  const handleChat = () => {
    router.push(`/messages?userId=${mentee.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            asChild
            className="hover:bg-transparent hover:text-primary p-0 font-bold text-muted-foreground transition-colors"
          >
            <Link href="/community">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Mural de Mentorados
            </Link>
          </Button>

          {isOwner && (
            <Button variant="outline" asChild size="sm" className="rounded-xl font-bold border-2">
              <Link href="/profile">Editar meu Perfil</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 md:pb-0">
          {/* Left Column: Essential Info & Goals */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Header Card */}
            <Card className="border-none shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-md overflow-hidden relative rounded-[2.5rem]">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <MessageCircle className="h-32 w-32" />
              </div>
              <CardHeader className="pb-10 pt-12 px-8 md:px-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                  <div className="relative">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-8 border-white shadow-2xl">
                      <AvatarImage src={mentee.avatar_url} />
                      <AvatarFallback className="text-4xl font-bold bg-primary/5 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white shadow-lg animate-pulse">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h1 className="text-4xl font-black tracking-tight text-gray-900">
                          {fullName}
                        </h1>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-none font-black uppercase tracking-widest text-[10px] px-3 py-1"
                        >
                          Buscando Mentoria
                        </Badge>
                      </div>
                      <p className="text-2xl text-primary/70 font-bold">
                        {mentee.job_title || "Mentorado"}
                        {mentee.company && (
                          <span className="text-muted-foreground/60 font-medium">
                            {" "}
                            @ {mentee.company}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-500 font-bold uppercase tracking-wider">
                      {(mentee.city || mentee.country) && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1.5 text-primary/40" />
                          {[mentee.city, mentee.state, mentee.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-primary/40" />
                        Desde {formatDate(mentee.created_at)}
                      </div>
                    </div>

                    {/* Chat CTA Desktop */}
                    {!isOwner && (
                      <div className="hidden md:flex pt-4">
                        <Button
                          size="xl"
                          onClick={handleChat}
                          className="rounded-2xl px-12 font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        >
                          <MessageCircle className="mr-2 h-6 w-6" />
                          {isMentor ? "Oferecer Ajuda Agora" : "Iniciar Conversa"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Bio / Story */}
            {mentee.bio && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                  <User className="h-4 w-4 text-primary" />
                  Trajetória e Motivação
                </h3>
                <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem]">
                  <CardContent className="p-8 md:p-10">
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap italic">
                      "{mentee.bio}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* What I want to learn */}
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Interesses de Mentoria
              </h3>
              <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="space-y-8">
                    {mentee.mentorship_topics &&
                    mentee.mentorship_topics.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {mentee.mentorship_topics.map((topic, i) => (
                          <Badge
                            key={i}
                            className="px-6 py-2 bg-primary/5 text-primary border-primary/10 text-base font-bold rounded-2xl"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-sm">
                        Nenhum tópico específico listado ainda.
                      </p>
                    )}

                    {mentee.career_goals && (
                      <div className="pt-8 border-t border-gray-50">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                          <Target className="h-5 w-5 text-primary" />
                          Onde quero chegar
                        </h4>
                        <p className="text-gray-700 text-lg leading-relaxed">
                          {mentee.career_goals}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Background & Links */}
          <div className="space-y-8">
            {/* Education & Experience Sidebar */}
            <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-white">
              <div className="h-3 bg-gradient-to-r from-primary to-primary-700"></div>
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 px-8 pb-10">
                {(mentee.institution || mentee.course) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <GraduationCap className="h-5 w-5" />
                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">
                        Acadêmico
                      </span>
                    </div>
                    <div className="pl-7 space-y-1">
                      {mentee.course && (
                        <p className="font-bold text-gray-900 text-lg leading-tight">
                          {mentee.course}
                        </p>
                      )}
                      {mentee.institution && (
                        <p className="text-base text-muted-foreground font-medium">
                          {mentee.institution}
                        </p>
                      )}
                      {mentee.academic_level && (
                        <Badge
                          variant="outline"
                          className="mt-3 text-[9px] font-black uppercase border-2"
                        >
                          {mentee.academic_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {(mentee.job_title || mentee.company) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="h-5 w-5" />
                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">
                        Profissional
                      </span>
                    </div>
                    <div className="pl-7 space-y-1">
                      {mentee.job_title && (
                        <p className="font-bold text-gray-900 text-lg leading-tight">
                          {mentee.job_title}
                        </p>
                      )}
                      {mentee.company && (
                        <p className="text-base text-muted-foreground font-medium">
                          {mentee.company}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume / CV Section */}
            {mentee.cv_url && (
              <Card className="border-2 border-primary/5 shadow-xl shadow-primary/5 bg-white hover:border-primary/20 transition-all rounded-[2rem] overflow-hidden group">
                <CardHeader className="pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    Currículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full font-black rounded-xl shadow-lg shadow-primary/10 group-hover:scale-[1.02] transition-transform"
                    onClick={() => setIsPdfViewerOpen(true)}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Ver Trajetória
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(mentee.linkedin_url ||
              mentee.github_url ||
              mentee.portfolio_url) && (
              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-white">
                <CardHeader className="pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-black uppercase tracking-tighter">Conecte-se</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3 px-8 pb-10">
                  {mentee.linkedin_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full h-12 rounded-xl text-blue-600 border-blue-50 bg-blue-50/30 hover:bg-blue-100 transition-colors"
                      asChild
                    >
                      <a
                        href={mentee.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-6 w-6 fill-current" />
                      </a>
                    </Button>
                  )}
                  {mentee.github_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full h-12 rounded-xl text-gray-900 border-gray-100 bg-gray-50 hover:bg-gray-200 transition-colors"
                      asChild
                    >
                      <a
                        href={mentee.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-6 w-6 fill-current" />
                      </a>
                    </Button>
                  )}
                  {mentee.portfolio_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full h-12 rounded-xl text-primary border-primary/5 bg-primary/5 hover:bg-primary/10 transition-colors"
                      asChild
                    >
                      <a
                        href={mentee.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-6 w-6" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        {!isOwner && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <Button
              size="xl"
              onClick={handleChat}
              className="w-full rounded-2xl font-black shadow-2xl shadow-primary/40"
            >
              <MessageCircle className="mr-2 h-6 w-6" />
              {isMentor ? "Oferecer Ajuda Agora" : "Iniciar Conversa"}
            </Button>
          </div>
        )}

        {/* PDF Viewer Dialog */}
        {mentee.cv_url && (
          <PdfViewerDialog
            open={isPdfViewerOpen}
            onOpenChange={setIsPdfViewerOpen}
            pdfUrl={mentee.cv_url}
            title={`Currículo - ${fullName}`}
          />
        )}
      </div>
    </div>
  )
}
