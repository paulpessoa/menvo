"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, User, Lightbulb, Handshake, ArrowRight } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useToast } from "@/hooks/useToast"
import Link from "next/link"
import { useTranslation } from "react-i18next"

export default function WelcomePage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const router = useRouter()
  const { toast } = useToast()

  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push("/login")
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para ver esta página.",
          variant: "destructive",
        })
      } else if (userProfile?.is_profile_complete) {
        // If profile is already complete, redirect to dashboard
        router.push("/dashboard")
      } else {
        setShowWelcome(true)
      }
    }
  }, [user, authLoading, userProfile, profileLoading, router, toast])

  if (authLoading || profileLoading || !showWelcome) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando página de boas-vindas...</p>
      </div>
    )
  }

  const isMentor = userProfile?.role === 'mentor'
  const isMentee = userProfile?.role === 'mentee'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <Card className="w-full max-w-3xl text-center">
        <CardHeader className="space-y-1">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <CardTitle className="text-3xl font-bold">
            {t('welcome.title', { name: userProfile?.full_name || user?.email?.split('@')[0] || 'Usuário' })}
          </CardTitle>
          <CardDescription className="text-lg">
            {t('welcome.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col items-center text-center">
              <User className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('welcome.completeProfile.title')}</h3>
              <p className="text-muted-foreground mb-4">{t('welcome.completeProfile.description')}</p>
              <Link href="/profile" passHref className="w-full">
                <Button variant="outline" className="w-full">
                  {t('welcome.completeProfile.button')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>

            {isMentee && (
              <Card className="p-6 flex flex-col items-center text-center">
                <Lightbulb className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('welcome.findMentors.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('welcome.findMentors.description')}</p>
                <Link href="/mentors" passHref className="w-full">
                  <Button className="w-full">
                    {t('welcome.findMentors.button')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            )}

            {isMentor && (
              <Card className="p-6 flex flex-col items-center text-center">
                <Handshake className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('welcome.setAvailability.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('welcome.setAvailability.description')}</p>
                <Link href="/mentorship" passHref className="w-full">
                  <Button className="w-full">
                    {t('welcome.setAvailability.button')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          <div className="mt-8">
            <p className="text-muted-foreground text-sm">
              {t('welcome.readyToExplore')}
            </p>
            <Link href="/dashboard" passHref>
              <Button variant="link" className="mt-2">
                {t('welcome.goToDashboard')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
