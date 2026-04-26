"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MapPin, Briefcase, Calendar, Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MentorProfile {
  id: string | null
  full_name: string | null
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
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
  experience_years: number | null
  slug: string | null
  created_at?: string | null
}

interface MentorCardProps {
  mentor: MentorProfile
  isAIHighlighted?: boolean
  aiReason?: string | null
}

export function MentorCard({
  mentor,
  isAIHighlighted,
  aiReason
}: MentorCardProps) {
  const t = useTranslations("mentorsPage")
  const router = useRouter()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric"
    })
  }

  const getAvailabilityColor = (status: string | null) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "unavailable":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAvailabilityText = (status: string | null) => {
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

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/mentors/${mentor.slug || mentor.id || ""}`)
  }

  return (
    <Card
      className={`hover:shadow-xl transition-all duration-300 flex flex-col h-full relative group border-none shadow-md rounded-[2rem] overflow-hidden bg-white ${
        isAIHighlighted
          ? "ring-2 ring-primary/50 shadow-primary/10 scale-[1.02]"
          : ""
      }`}
    >
      {isAIHighlighted && (
        <div className="absolute -top-3 -right-3 z-20 bg-primary text-white p-2 rounded-full shadow-lg animate-bounce">
          <Sparkles className="h-5 w-5" />
        </div>
      )}

      <CardHeader className="pb-3 px-6 pt-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <AvatarImage
                src={mentor.avatar_url || undefined}
                alt={mentor.full_name || undefined}
              />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {mentor.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "M"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {mentor.full_name}
                </CardTitle>
                {isAIHighlighted && (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[9px] uppercase font-black tracking-widest border-none h-4">
                    IA Match
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm font-semibold text-primary/70 line-clamp-1">
                {mentor.job_title}
                {mentor.company && <span className="text-muted-foreground font-medium italic"> @ {mentor.company}</span>}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col px-8 pb-8">
        {isAIHighlighted && aiReason && (
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 text-xs text-primary font-medium italic leading-relaxed">
            "{aiReason}"
          </div>
        )}

        <div className="flex justify-between items-center">
          <Badge
            variant="secondary"
            className={`${getAvailabilityColor(mentor.availability_status)} border-none text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full`}
          >
            {getAvailabilityText(mentor.availability_status)}
          </Badge>
          
          {mentor.experience_years && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
               <Briefcase className="h-3.5 w-3.5 text-primary/60" />
               {mentor.experience_years} {t("years")}
            </div>
          )}
        </div>

        {mentor.bio && (
          <p className="text-sm text-gray-600 line-clamp-3 min-h-[3rem] leading-relaxed italic">
            "{mentor.bio}"
          </p>
        )}

        {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {mentor.mentorship_topics.slice(0, 3).map((topic, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-[9px] font-bold uppercase tracking-wider bg-gray-100/80 text-gray-600 border-none"
              >
                {topic}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mt-auto pt-6 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>Desde {formatDate(mentor.created_at)}</span>
          </div>
          
          {(mentor.city || mentor.country) && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="max-w-[80px] truncate">{mentor.city || mentor.country}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={handleProfileClick} className="w-full rounded-2xl h-11 font-bold shadow-lg shadow-primary/10">
            {t("viewProfile")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
