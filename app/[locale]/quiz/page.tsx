"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Gift, Sparkles, Users, Target, Compass } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { QuizForm, QuizFormData } from "@/components/quiz/QuizForm"
import { useToast } from "@/hooks/use-toast"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { quizService } from "@/lib/services/quiz/quiz.service"

export default function QuizPage() {
  const [showQuiz, setShowQuiz] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('quiz')
  const { user, profile } = useAuth()
  const searchParams = useSearchParams()
  const event = searchParams.get("event") || searchParams.get("stand")

  const handleQuizSubmit = async (data: QuizFormData) => {
    try {
      const res = await quizService.submitQuiz({
        name: data.name,
        email: data.email,
        linkedin_url: data.linkedinUrl || null,
        career_moment: data.careerMoment,
        mentorship_experience: data.mentorshipExperience,
        development_areas: data.developmentAreas,
        current_challenge: data.currentChallenge,
        future_vision: data.futureVision,
        share_knowledge: data.shareKnowledge,
        personal_life_help: data.personalLifeHelp
      })

      toast({
        title: t('quiz_form.submit_success_title'),
        description: t('quiz_form.submit_success_description')
      })

      // Redirect to results page with response ID and preserve event context if present
      const redirectUrl = event ? `/quiz/results/${res.id}?event=${encodeURIComponent(event)}` : `/quiz/results/${res.id}`
      router.push(redirectUrl)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: t('quiz_form.submit_error_title'),
        description: t('quiz_form.submit_error_description'),
        variant: "destructive"
      })
    }
  }

  if (showQuiz) {
    const initialData: Partial<QuizFormData> = {
      name: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '',
      email: user?.email || '',
      linkedinUrl: profile?.linkedin_url || ''
    }

    return (
      <QuizForm
        onSubmit={handleQuizSubmit}
        onBack={() => setShowQuiz(false)}
        initialData={initialData}
      />
    )
  }

  return (
    <AnimatedBackground>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-6">
            <h1
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              {t('quiz_page.title')}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('quiz_page.subtitle')}
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <CardHeader>
                <Target className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">{t('quiz_page.personalized_analysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('quiz_page.personalized_analysis_description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">{t('quiz_page.ideal_mentors')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('quiz_page.ideal_mentors_description')}
                </p>
              </CardContent>
            </Card>

            {event ? (
              <Card className="border-2 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <CardHeader>
                  <Gift className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">{t('quiz_page.get_a_gift')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('quiz_page.get_a_gift_description')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <CardHeader>
                  <Compass className="h-8 w-8 text-emerald-600 mb-2" />
                  <CardTitle className="text-lg">{t('quiz_page.practical_steps')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('quiz_page.practical_steps_description')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main CTA Card */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardContent className="space-y-6">
              <Button
                size="lg"
                className="w-full text-lg mt-8 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowQuiz(true)}
              >
                {t('quiz_page.start_quiz')}
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('quiz_page.responses_confidential')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  )
}
