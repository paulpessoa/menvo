"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Briefcase,
  Calendar,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  Languages,
  Award,
  Heart,
  Share2,
  Globe,
  Sparkles,
  BookOpen,
  Info,
  User,
  Github,
  Linkedin
} from "lucide-react"
import { toast } from "sonner"
import { Link, useRouter } from "@/i18n/routing"
import { AvailabilityDisplay } from "@/components/mentorship/AvailabilityDisplay"
import { BookMentorshipModal } from "@/components/mentorship/BookMentorshipModal"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useTranslations } from "next-intl"
import { MentorshipReviews } from "@/components/mentors/MentorshipReviews"
import { useFavorites } from "@/hooks/useFavorites"
import { useAuth } from "@/lib/auth"

interface MentorProfile {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  city: string | null
  state: string | null
  country: string | null
  languages: string[] | null
  mentorship_topics: string[] | null
  inclusive_tags: string[] | null
  expertise_areas: string[] | null
  availability_status: string
  average_rating: number
  total_reviews: number
  total_sessions: number
  chat_enabled: boolean
  experience_years: number | null
  linkedin_url: string | null
  github_url: string | null
  twitter_url: string | null
  website_url: string | null
  timezone: string | null
  slug: string | null
  created_at?: string
}

interface MentorAvailability {
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string | null
}

interface Props {
  mentor: MentorProfile
  availability: MentorAvailability[]
}

export default function MentorProfileClient({ mentor, availability }: Props) {
  const t = useTranslations("mentorsPage")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  const { user } = useAuth()
  const { favorites, toggleFavorite } = useFavorites(user?.id)
  const isFavorite = favorites.includes(mentor.id)
  const isOwner = user?.id === mentor.id

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: t("share.title", { name: mentor.full_name }),
          text: t("share.text", {
            name: mentor.full_name,
            topics: mentor.mentorship_topics?.slice(0, 2).join(", ") || ""
          }),
          url: url
        })
        toast.success(t("share.success"))
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          copyToClipboard(url)
        }
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t("share.copySuccess"))
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-none"
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-none"
      case "unavailable":
        return "bg-red-100 text-red-800 border-none"
      default:
        return "bg-gray-100 text-gray-800 border-none"
    }
  }

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case "available":
        return t("status.available")
      case "busy":
        return t("status.busy")
      case "unavailable":
        return t("status.unavailable")
      default:
        return t("status.unknown")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Abril 2024"
    return new Date(dateString).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    })
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
            <Link href="/mentors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToMentors")}
            </Link>
          </Button>

          {isOwner && (
            <Button variant="outline" asChild size="sm" className="rounded-xl font-bold border-2">
              <Link href="/profile">Editar meu Perfil</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 md:pb-0">
          {/* Left Column: Essential Info & Bio */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Header Card */}
            <Card className="border-none shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-md overflow-hidden relative rounded-[2.5rem]">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Sparkles className="h-32 w-32" />
              </div>
              <CardHeader className="pb-10 pt-12 px-8 md:px-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                  <div className="relative">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-8 border-white shadow-2xl">
                      <AvatarImage src={mentor.avatar_url || undefined} />
                      <AvatarFallback className="text-4xl font-bold bg-primary/5 text-primary">
                        {mentor.full_name?.split(" ").map(n => n[0]).join("") || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full border-4 border-white shadow-lg">
                      <Briefcase className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-gray-900">
                          {mentor.full_name}
                        </h1>
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleFavorite(mentor.id)}
                                className={`h-10 w-10 rounded-full transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-muted/50 text-gray-400 hover:text-red-400'}`}
                            >
                                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10 rounded-full bg-muted/50 text-gray-400">
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                      </div>
                      <p className="text-2xl text-primary/70 font-bold">
                        {mentor.job_title}
                        {mentor.company && (
                          <span className="text-muted-foreground/60 font-medium">
                            {" "}
                            @ {mentor.company}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-500 font-bold uppercase tracking-wider">
                      {(mentor.city || mentor.country) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/40" />
                          {[mentor.city, mentor.state, mentor.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/40" />
                        Membro desde {formatDate(mentor.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center justify-center md:justify-start pt-2">
                        <Badge className={`${getAvailabilityColor(mentor.availability_status)} font-black uppercase tracking-widest text-[10px] px-3 py-1`}>
                            {getAvailabilityText(mentor.availability_status)}
                        </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Bio / About */}
            {mentor.bio && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                  <User className="h-4 w-4 text-primary" />
                  {t("about")}
                </h3>
                <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem]">
                  <CardContent className="p-8 md:p-10">
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap italic">
                      "{mentor.bio}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Specialties & Inclusion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(mentor.mentorship_topics?.length || mentor.expertise_areas?.length) && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {t("specialties")}
                        </h3>
                        <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] h-full">
                            <CardContent className="p-8 space-y-6">
                                {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{t("topics")}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.mentorship_topics.map((topic, i) => (
                                                <Badge key={i} className="bg-primary/5 text-primary border-none font-bold px-3 py-1 rounded-xl">
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Expertise</p>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.expertise_areas.map((area, i) => (
                                                <Badge key={i} variant="outline" className="border-2 font-bold px-3 py-1 rounded-xl text-gray-600">
                                                    {area}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {(mentor.languages?.length || mentor.inclusive_tags?.length) && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                            <Award className="h-4 w-4 text-primary" />
                            Cultura e Inclusão
                        </h3>
                        <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] h-full">
                            <CardContent className="p-8 space-y-6">
                                {mentor.languages && mentor.languages.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{t("languages")}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.languages.map((lang, i) => (
                                                <Badge key={i} className="bg-muted text-gray-700 border-none font-bold px-3 py-1 rounded-xl">
                                                    {lang}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {mentor.inclusive_tags && mentor.inclusive_tags.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Inclusão</p>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.inclusive_tags.map((tag, i) => (
                                                <Badge key={i} className="bg-purple-50 text-purple-700 border-none font-bold px-3 py-1 rounded-xl">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <MentorshipReviews mentorId={mentor.id} />
          </div>

          {/* Right Column: Actions & Availability */}
          <div className="space-y-8">
            {/* Booking Card */}
            <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-white relative">
              <div className="h-3 bg-gradient-to-r from-primary to-primary-700"></div>
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-xl font-black uppercase tracking-tighter">{t("scheduleSession")}</CardTitle>
                <CardDescription className="font-bold text-primary">{t("freeMentorships")}</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                {isOwner ? (
                  <div className="bg-primary/5 rounded-2xl p-4 text-center border border-primary/10">
                    <p className="text-sm font-bold text-primary/70 italic">
                      {t("ownProfileMessage")}
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full rounded-2xl h-14 font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform text-lg"
                    disabled={
                      mentor.availability_status === "busy" ||
                      mentor.availability_status === "unavailable"
                    }
                    onClick={() => {
                      if (!user) {
                        setShowLoginModal(true)
                      } else {
                        setIsScheduleModalOpen(true)
                      }
                    }}
                  >
                    <Calendar className="mr-2 h-6 w-6" />
                    {mentor.availability_status === "busy" ||
                    mentor.availability_status === "unavailable"
                      ? t("fullSchedule")
                      : t("bookMentorship")}
                  </Button>
                )}
                
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-2xl">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Sua sessão de mentoria será agendada via Google Meet. Um convite será enviado para ambos os e-mails após a confirmação do mentor.
                    </p>
                </div>
              </CardContent>
            </Card>

            <AvailabilityDisplay
              availability={availability}
              availability_status={mentor.availability_status}
            />

            {/* Links Section */}
            {(mentor.linkedin_url ||
              mentor.github_url ||
              mentor.website_url) && (
              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-white">
                <CardHeader className="pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Conecte-se
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 px-8 pb-10">
                  {mentor.linkedin_url && (
                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl font-bold border-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-all" asChild>
                      <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {mentor.github_url && (
                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl font-bold border-2 hover:bg-gray-50 hover:text-gray-900 transition-all" asChild>
                      <a href={mentor.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {mentor.website_url && (
                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl font-bold border-2 transition-all" asChild>
                      <a href={mentor.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
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
              onClick={() => {
                if (!user) setShowLoginModal(true)
                else setIsScheduleModalOpen(true)
              }}
              className="w-full rounded-2xl font-black shadow-2xl shadow-primary/40"
              disabled={mentor.availability_status === "busy" || mentor.availability_status === "unavailable"}
            >
              <Calendar className="mr-2 h-6 w-6" />
              {mentor.availability_status === "busy" || mentor.availability_status === "unavailable"
                ? t("fullSchedule")
                : t("bookMentorship")}
            </Button>
          </div>
        )}
      </div>

      {user && user.id !== mentor.id && (
        <BookMentorshipModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          mentorId={mentor.id}
          mentorName={mentor.full_name}
        />
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={t("loginRequired.title")}
        description={t("loginRequired.description")}
      />
    </div>
  )
}
