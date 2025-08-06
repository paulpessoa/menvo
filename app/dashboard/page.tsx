"use client"

import { useAuth } from "@/hooks/useAuth"
import { useUserProfile } from '@/hooks/useUserProfile'
import { Loader2Icon, UserIcon, CalendarDaysIcon, MessageSquareIcon, BookOpenIcon, ShieldIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, isLoading: authLoading, isMentor, isMentee, isAdmin } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !profileLoading && user && userProfile && !userProfile.is_profile_complete) {
      router.push('/welcome')
    }
  }, [user, userProfile, authLoading, profileLoading, router])

  if (authLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('dashboard.title', { name: userProfile?.full_name || user?.email?.split('@')[0] || t('dashboard.user') })}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">{t('dashboard.profileCard.title')}</CardTitle>
              <UserIcon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{t('dashboard.profileCard.description')}</CardDescription>
              <Link href="/profile" passHref>
                <Button className="w-full">{t('dashboard.profileCard.button')}</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Calendar/Sessions Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">{t('dashboard.calendarCard.title')}</CardTitle>
              <CalendarDaysIcon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{t('dashboard.calendarCard.description')}</CardDescription>
              <Link href="/calendar" passHref>
                <Button className="w-full">{t('dashboard.calendarCard.button')}</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">{t('dashboard.messagesCard.title')}</CardTitle>
              <MessageSquareIcon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{t('dashboard.messagesCard.description')}</CardDescription>
              <Link href="/messages" passHref>
                <Button className="w-full">{t('dashboard.messagesCard.button')}</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Mentee Specific Card */}
          {isMentee && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{t('dashboard.findMentorsCard.title')}</CardTitle>
                <BookOpenIcon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{t('dashboard.findMentorsCard.description')}</CardDescription>
                <Link href="/mentors" passHref>
                  <Button className="w-full">{t('dashboard.findMentorsCard.button')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Mentor Specific Card */}
          {isMentor && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{t('dashboard.mentorshipSettingsCard.title')}</CardTitle>
                <ShieldIcon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{t('dashboard.mentorshipSettingsCard.description')}</CardDescription>
                <Link href="/mentorship" passHref>
                  <Button className="w-full">{t('dashboard.mentorshipSettingsCard.button')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Admin Specific Card */}
          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{t('dashboard.adminPanelCard.title')}</CardTitle>
                <ShieldIcon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{t('dashboard.adminPanelCard.description')}</CardDescription>
                <Link href="/admin" passHref>
                  <Button className="w-full">{t('dashboard.adminPanelCard.button')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
