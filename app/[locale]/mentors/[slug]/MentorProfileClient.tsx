"use client"

import { useState, useEffect } from "react"
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
  Clock,
  Video,
  CheckCircle,
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
import dynamic from "next/dynamic"

const BookMentorshipModal = dynamic(
  () => import("@/components/mentorship/BookMentorshipModal").then((mod) => mod.BookMentorshipModal),
  { ssr: false }
)
const LoginRequiredModal = dynamic(
  () => import("@/components/auth/LoginRequiredModal").then((mod) => mod.LoginRequiredModal),
  { ssr: false }
)
import { useTranslations } from "next-intl"
import { MentorshipReviews } from "@/components/mentors/MentorshipReviews"
import { useFavorites } from "@/hooks/useFavorites"
import { useAuth } from "@/lib/auth"

export interface MentorProfile {
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

/** Fetched separately, only for logged-in users - see /api/mentors/[slug]/approach. */
interface MentorApproach {
  mentorship_approach: string | null
  what_to_expect: string | null
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

  const [approach, setApproach] = useState<MentorApproach | null>(null)
  useEffect(() => {
    if (!user || !mentor.slug) return
    let cancelled = false
    fetch(`/api/mentors/${mentor.slug}/approach`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) setApproach(json.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user, mentor.slug])

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
              {t("backToMentors")}
            </Link>
          </Button>

          {isOwner && (
            <Button variant="outline" asChild size="sm" className="rounded-xl font-bold border-2">
              <Link href="/profile">{t("editMyProfile")}</Link>
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
              <CardHeader className="pb-8 pt-10 px-6 md:px-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
                  <div className="relative">
                    <Avatar className="h-28 w-28 md:h-36 md:w-36 border-8 border-white shadow-2xl">
                      <AvatarImage src={mentor.avatar_url || undefined} />
                      <AvatarFallback className="text-4xl font-bold bg-primary/5 text-primary">
                        {mentor.full_name?.split(" ").map(n => n[0]).join("") || "M"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                          {mentor.full_name}
                        </h1>
                      </div>
                      <p className="text-lg md:text-xl text-primary font-bold">
                        {mentor.job_title}
                        {mentor.company && (
                          <span className="text-muted-foreground/70 font-semibold">
                            {" "}
                            @ {mentor.company}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                      {(mentor.city || mentor.country) && (
                        <div className="flex items-center gap-1.5 bg-muted/60 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {[mentor.city, mentor.state, mentor.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-muted/60 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Membro desde {formatDate(mentor.created_at)}
                      </div>
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
                  <CardContent className="p-6 md:p-8">
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap italic">
                      "{mentor.bio}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mentorship Approach / What to Expect - logged-in mentees only, never public */}
            {user ? (
              (approach?.mentorship_approach || approach?.what_to_expect) && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    {t("mentorshipApproach")}
                  </h3>
                  <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem]">
                    <CardContent className="p-8 md:p-10 space-y-6">
                      {approach.mentorship_approach && (
                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                          {approach.mentorship_approach}
                        </p>
                      )}
                      {approach.what_to_expect && (
                        <div className="space-y-2 pt-2 border-t border-muted">
                          <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                            {t("whatToExpect")}
                          </p>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {approach.what_to_expect}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted/20 border rounded-2xl text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                {t("loginToSeeApproach")}
              </div>
            )}

            {/* Specialties & Inclusion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {t("topics")}
                        </h3>
                        <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] h-full">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {mentor.mentorship_topics.map((topic, i) => (
                                        <Badge key={i} className="bg-primary/5 text-primary border-none font-bold px-3 py-1 rounded-xl">
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                            <Award className="h-4 w-4 text-primary" />
                            {t("expertise")}
                        </h3>
                        <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] h-full">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {mentor.expertise_areas.map((area, i) => (
                                        <Badge key={i} variant="outline" className="border-2 font-bold px-3 py-1 rounded-xl text-gray-600">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {mentor.inclusive_tags && mentor.inclusive_tags.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-2">
                            <Heart className="h-4 w-4 text-primary" />
                            {t("cultureAndInclusion")}
                        </h3>
                        <Card className="border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] h-full">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {mentor.inclusive_tags.map((tag, i) => (
                                        <Badge key={i} className="bg-purple-50 text-purple-700 border-none font-bold px-3 py-1 rounded-xl">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
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
            <Card className="border-none shadow-xl shadow-primary/10 rounded-[2rem] overflow-hidden bg-white relative">
              <CardHeader className="pb-3 pt-7 px-7">
                <CardTitle className="text-xl font-black tracking-tight">
                  {t("scheduleSession")}
                </CardTitle>
                <CardDescription className="font-semibold text-primary">
                  {t("freeMentorships")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 pb-7 space-y-5">
                {/* Meta details */}
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { icon: Clock, label: t("durationLabel"), value: t("durationValue") },
                    { icon: Video, label: t("formatLabel"), value: t("formatValue") },
                    { icon: Calendar, label: t("windowLabel"), value: t("windowValue") }
                  ].map(({ icon: Icon, label, value }, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-muted/30 rounded-xl">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight">
                          {label}
                        </p>
                        <p className={`text-sm font-bold truncate text-foreground`}>
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {isOwner ? (
                  <div className="space-y-3">
                    <div className="bg-primary/5 rounded-2xl p-4 text-center border border-primary/10">
                      <p className="text-sm font-bold text-primary/70 italic">
                        {t("ownProfileMessage")}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-2xl h-12 font-bold hover:bg-primary/5 transition-all"
                    >
                      <Link href="/dashboard/mentor/availability">
                        {t("manageAvailability")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 rounded-2xl h-14 font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all text-base sm:text-lg"
                      disabled={
                        availability.length === 0 ||
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
                      {mentor.availability_status === "busy" ||
                      mentor.availability_status === "unavailable" ||
                      availability.length === 0 ? (
                        t("fullSchedule")
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          <span>Disponível</span>
                        </div>
                      )}
                    </Button>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFavorite(mentor.id)}
                        className={`h-14 w-14 rounded-2xl border-2 transition-all ${isFavorite ? 'bg-red-50 border-red-100 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleShare} className="h-14 w-14 rounded-2xl border-2 text-gray-400 hover:text-primary">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3.5 bg-muted/30 rounded-2xl">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("meetInfo")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Links Section */}
            {(mentor.linkedin_url ||
              mentor.github_url ||
              mentor.website_url) && (
              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-white">
                <CardHeader className="pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {t("connect")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 px-8 pb-10">
                  {mentor.linkedin_url && (
                    <Button variant="default" className="w-full justify-start h-12 rounded-xl font-bold bg-[#0a66c2] text-white hover:bg-[#004182] border-none transition-all" asChild>
                      <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5 mr-2 fill-current" />
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
            <div className="flex gap-2 max-w-[600px] mx-auto">
              <Button
                size="xl"
                onClick={() => {
                  if (!user) setShowLoginModal(true)
                  else setIsScheduleModalOpen(true)
                }}
                className="flex-1 rounded-2xl font-black shadow-2xl shadow-primary/40 h-14"
                disabled={mentor.availability_status === "busy" || mentor.availability_status === "unavailable"}
              >
                {mentor.availability_status === "busy" || mentor.availability_status === "unavailable"
                  ? t("fullSchedule")
                  : t("bookMentorship")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleFavorite(mentor.id)}
                className={`h-14 w-14 shrink-0 rounded-2xl border-2 transition-all ${isFavorite ? 'bg-red-50 border-red-100 text-red-500 bg-white' : 'text-gray-400 hover:text-red-400 bg-white'}`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare} className="h-14 w-14 shrink-0 rounded-2xl border-2 text-gray-400 hover:text-primary bg-white">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
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
