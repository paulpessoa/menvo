"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Heart, MapPin, MessageCircle, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  session_price_usd: number | null
  availability_status: string
  average_rating: number
  total_reviews: number
  total_sessions: number
  experience_years: number | null
  slug: string | null
}

interface MentorCardProps {
  mentor: MentorProfile
  isFavorite: boolean
  onToggleFavorite: () => void
}

export function MentorCard({ 
  mentor, 
  isFavorite, 
  onToggleFavorite 
}: MentorCardProps) {
  const t = useTranslations("mentorsPage")
  const router = useRouter()

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'unavailable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return t("status.available")
      case 'busy': return t("status.busy")
      case 'unavailable': return t("status.unavailable")
      default: return t("status.unknown")
    }
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/mentors/${mentor.slug || mentor.id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full relative group">
      <button 
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite();
        }}
        className={`absolute top-4 right-4 p-2 rounded-full shadow-sm transition-all z-10 ${
          isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-400'
        }`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={mentor.avatar_url || undefined} alt={mentor.full_name} />
              <AvatarFallback>
                {mentor.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg line-clamp-1 pr-8">{mentor.full_name}</CardTitle>
              <CardDescription className="text-sm line-clamp-1">
                {mentor.job_title}
                {mentor.company && ` @ ${mentor.company}`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
            <Badge variant="secondary" className={`${getAvailabilityColor(mentor.availability_status)} border-none whitespace-nowrap`}>
                {getAvailabilityText(mentor.availability_status)}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                {mentor.average_rating.toFixed(1)} ({mentor.total_reviews})
            </div>
        </div>

        {mentor.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {mentor.bio}
          </p>
        )}

        {(mentor.city || mentor.country) && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate">
              {[mentor.city, mentor.state, mentor.country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {mentor.mentorship_topics.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="outline" className="text-[10px] font-normal">
                {topic}
              </Badge>
            ))}
            {mentor.mentorship_topics.length > 3 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                +{mentor.mentorship_topics.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mt-4 border-t pt-4">
          <div className="flex items-center">
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            <span>{t("sessionsCount", { count: mentor.total_sessions || 0 })}</span>
          </div>
          {mentor.experience_years && (
             <span className="font-medium">{mentor.experience_years} {t("years")}</span>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={handleProfileClick} className="w-full">
            {t("viewProfile")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
