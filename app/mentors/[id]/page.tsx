'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2Icon, MailIcon, MapPinIcon, BriefcaseIcon, GraduationCapIcon, LanguagesIcon, LinkedinIcon, GlobeIcon, StarIcon, CalendarDaysIcon, MessageSquareIcon, CheckCircleIcon } from 'lucide-react'
import { useMentors } from '@/hooks/useMentors'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { mentorship_session } from '@/types/database'
import { ScheduleSessionModal } from '@/components/mentorship/ScheduleSessionModal'

export default function MentorProfilePage() {
  const { t } = useTranslation()
  const params = useParams()
  const mentorId = params.id as string
  const { user, isLoading: authLoading, isMentee } = useAuth()
  const { mentor, loading, error } = useMentors(mentorId)

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  useEffect(() => {
    if (error) {
      console.error('Error fetching mentor:', error)
    }
  }, [error])

  const handleOpenScheduleModal = () => {
    setIsScheduleModalOpen(true)
  }

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false)
    // Optionally refresh mentor data or sessions after scheduling
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  if (error || !mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">{t('mentorProfile.notFoundTitle')}</h1>
        <p className="text-lg mb-6">{t('mentorProfile.notFoundDescription')}</p>
        <Button onClick={() => window.history.back()}>{t('common.goBack')}</Button>
      </div>
    )
  }

  const profile = mentor.user_profiles
  const skills = mentor.skills || []

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mentor Summary Card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6">
            <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4 border-4 border-background shadow-lg bg-muted">
              <Image
                src={profile?.avatar_url || "/placeholder-user.jpg"}
                alt={profile?.full_name || "Mentor"}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <h2 className="text-2xl font-bold mb-1">{profile?.full_name || t('common.unknown')}</h2>
            <p className="text-muted-foreground mb-2">{profile?.occupation || t('common.notProvided')}</p>
            {profile?.verified_at && (
              <Badge variant="default" className="mb-4 bg-green-500 text-white">
                <CheckCircleIcon className="h-4 w-4 mr-1" /> {t('mentorProfile.verifiedMentor')}
              </Badge>
            )}

            <Separator className="w-full my-4" />

            <div className="w-full space-y-3 text-sm text-muted-foreground">
              {profile?.location && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.years_experience !== null && profile?.years_experience !== undefined && (
                <div className="flex items-center gap-2">
                  <StarIcon className="h-4 w-4" />
                  <span>{t('mentorProfile.yearsExperience', { years: profile.years_experience })}</span>
                </div>
              )}
              {profile?.education_level && (
                <div className="flex items-center gap-2">
                  <GraduationCapIcon className="h-4 w-4" />
                  <span>{profile.education_level}</span>
                </div>
              )}
              {profile?.languages && profile.languages.length > 0 && (
                <div className="flex items-center gap-2">
                  <LanguagesIcon className="h-4 w-4" />
                  <span>{profile.languages.join(", ")}</span>
                </div>
              )}
              {profile?.social_links?.linkedin && (
                <div className="flex items-center gap-2">
                  <LinkedinIcon className="h-4 w-4" />
                  <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="underline">
                    LinkedIn
                  </a>
                </div>
              )}
              {profile?.social_links?.website && (
                <div className="flex items-center gap-2">
                  <GlobeIcon className="h-4 w-4" />
                  <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="underline">
                    {t('mentorProfile.website')}
                  </a>
                </div>
              )}
            </div>

            {user && isMentee && user.id !== mentor.user_id && (
              <div className="w-full mt-6 space-y-2">
                <Button className="w-full" onClick={handleOpenScheduleModal}>
                  <CalendarDaysIcon className="mr-2 h-4 w-4" /> {t('mentorProfile.scheduleSession')}
                </Button>
                <Button variant="outline" className="w-full">
                  <MailIcon className="mr-2 h-4 w-4" /> {t('mentorProfile.sendMessage')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentor Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('mentorProfile.aboutSection.title')}</CardTitle>
              <CardDescription>{t('mentorProfile.aboutSection.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {profile?.bio || t('mentorProfile.aboutSection.noBio')}
              </p>
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('mentorProfile.skillsSection.title')}</CardTitle>
              <CardDescription>{t('mentorProfile.skillsSection.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                      {skill.skill_name} ({skill.proficiency_level})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('mentorProfile.skillsSection.noSkills')}</p>
              )}
            </CardContent>
          </Card>

          {/* Availability Section (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>{t('mentorProfile.availabilitySection.title')}</CardTitle>
              <CardDescription>{t('mentorProfile.availabilitySection.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('mentorProfile.availabilitySection.placeholder')}
              </p>
              {/* In a real application, this would display the mentor's available slots */}
            </CardContent>
          </Card>

          {/* Reviews/Ratings Section (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>{t('mentorProfile.reviewsSection.title')}</CardTitle>
              <CardDescription>{t('mentorProfile.reviewsSection.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('mentorProfile.reviewsSection.placeholder')}
              </p>
              {/* In a real application, this would display reviews and ratings */}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleSessionModal
        isOpen={isScheduleModalOpen}
        onClose={handleCloseScheduleModal}
        mentorId={mentor.id}
        menteeId={user?.id || ''}
      />
    </div>
  )
}
