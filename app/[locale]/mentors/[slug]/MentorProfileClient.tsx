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
  Globe
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { AvailabilityDisplay } from "@/components/mentorship/AvailabilityDisplay"
import { BookMentorshipModal } from "@/components/mentorship/BookMentorshipModal"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useTranslations } from "next-intl"
import { MentorshipReviews } from "@/components/mentors/MentorshipReviews"

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    fetchUser()
  }, [])

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
        return "bg-green-100 text-green-800 border-green-200"
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "unavailable":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/mentors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToMentors")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mentor.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {mentor.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {mentor.full_name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {mentor.job_title}
                      {mentor.company && ` @ ${mentor.company}`}
                    </CardDescription>
                    {(mentor.city || mentor.country) && (
                      <div className="flex items-center text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {[mentor.city, mentor.state, mentor.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      toast.info(
                        t("toast.featureUnderDevelopment") ||
                          "Feature under development"
                      )
                    }
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Badge
                  className={getAvailabilityColor(mentor.availability_status)}
                >
                  {getAvailabilityText(mentor.availability_status)}
                </Badge>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span>
                      {t("sessionsCount", {
                        count: mentor.total_sessions || 0
                      })}
                    </span>
                  </div>

                  {mentor.experience_years !== null && (
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      <span>
                        {t("yearsExperienceCount", {
                          count: mentor.experience_years
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {mentor.bio && (
            <Card>
              <CardHeader>
                <CardTitle>{t("about")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {mentor.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {(mentor.mentorship_topics?.length ||
            mentor.expertise_areas?.length) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("specialties")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentor.mentorship_topics &&
                  mentor.mentorship_topics.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">{t("topics")}</h4>
                      <div className="flex flex-wrap gap-2">
                        {mentor.mentorship_topics.map((topic, index) => (
                          <Badge key={index} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {mentor.expertise_areas &&
                  mentor.expertise_areas.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">{t("expertise")}</h4>
                      <div className="flex flex-wrap gap-2">
                        {mentor.expertise_areas.map((area, index) => (
                          <Badge key={index} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {(mentor.languages?.length || mentor.inclusive_tags?.length) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("languagesAndInclusion")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentor.languages && mentor.languages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Languages className="h-4 w-4 mr-2" />
                      {t("languages")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mentor.languages.map((language, index) => (
                        <Badge key={index} variant="secondary">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mentor.inclusive_tags && mentor.inclusive_tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      {t("inclusiveTags")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mentor.inclusive_tags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="bg-purple-100 text-purple-800 border-purple-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <MentorshipReviews mentorId={mentor.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("scheduleSession")}</CardTitle>
              <CardDescription>{t("freeMentorships")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUserId === mentor.id ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    {t("ownProfileMessage")}
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={
                      mentor.availability_status === "busy" ||
                      mentor.availability_status === "unavailable"
                    }
                    onClick={() => {
                      if (!currentUserId) {
                        setShowLoginModal(true)
                      } else {
                        setIsScheduleModalOpen(true)
                      }
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {mentor.availability_status === "busy" ||
                    mentor.availability_status === "unavailable"
                      ? t("fullSchedule")
                      : t("bookMentorship")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <AvailabilityDisplay
            availability={availability}
            availability_status={mentor.availability_status}
          />

          {(mentor.linkedin_url ||
            mentor.github_url ||
            mentor.twitter_url ||
            mentor.website_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  {t("links")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mentor.linkedin_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={mentor.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {mentor.github_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={mentor.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                )}
                {mentor.twitter_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={mentor.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
                {mentor.website_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={mentor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {currentUserId && currentUserId !== mentor.id && (
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
