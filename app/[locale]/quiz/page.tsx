"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Compass, Info, ShieldCheck, Sparkles, Target, Users } from "lucide-react"
import { QuizForm, QuizFormData } from "@/components/quiz/QuizForm"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { quizService } from "@/lib/services/quiz/quiz.service"
import { trackQuizCompleted } from "@/lib/utils/google-analytics/events"

export default function QuizPage() {
  const [showQuiz, setShowQuiz] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('quiz')
  const { user, profile } = useAuth()

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

      trackQuizCompleted({
        responseId: res.id,
        email: data.email,
        hasEvent: false,
      })

      toast({
        title: t('quiz_form.submit_success_title'),
        description: t('quiz_form.submit_success_description')
      })

      router.push(`/quiz/results/${res.id}`)
    } catch (error: any) {
      console.error("Error submitting quiz:", error)
      const code = error?.code
      const title = code === "email_limit"
        ? t('quiz_form.submit_error_email_limit_title')
        : code === "budget"
          ? t('quiz_form.submit_error_budget_title')
          : t('quiz_form.submit_error_title')
      const description = error?.message || t('quiz_form.submit_error_description')
      toast({
        title,
        description,
        variant: "destructive"
      })
    }
  }

  if (showQuiz) {
    const initialData: Partial<QuizFormData> = {
      name: profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''),
      email: user?.email || '',
      linkedinUrl: profile?.linkedin_url || ''
    }

    return (
      <QuizForm
        onSubmit={handleQuizSubmit}
        onBack={() => setShowQuiz(false)}
        initialData={initialData}
        isAuthenticated={!!user}
      />
    )
  }

  const benefits = [
    {
      icon: Target,
      title: t('quiz_page.personalized_analysis'),
      description: t('quiz_page.personalized_analysis_description')
    },
    {
      icon: Users,
      title: t('quiz_page.ideal_mentors'),
      description: t('quiz_page.ideal_mentors_description')
    },
    {
      icon: Compass,
      title: t('quiz_page.practical_steps'),
      description: t('quiz_page.practical_steps_description')
    }
  ]

  // Mesma linguagem visual da página de resultados (/quiz/results/[id]):
  // fundo em degradê accent, título grande, cartões rounded-2xl e faixa primária.
  return (
    <div className="bg-gradient-to-b from-accent/70 via-background to-background">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 md:pt-14">
        <header className="border-b pb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t('quiz_page.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            {t('quiz_page.title')}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {t('quiz_page.subtitle')}
          </p>
        </header>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
            {t('quiz_page.benefits_title')}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-4 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold">{t('quiz_page.cta_title')}</p>
              <p className="mt-1 text-sm opacity-90">{t('quiz_page.cta_description')}</p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="shrink-0 rounded-xl font-bold"
              onClick={() => setShowQuiz(true)}
            >
              {t('quiz_page.start_quiz')}
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        <footer className="mt-10 space-y-3 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {t('quiz_page.responses_confidential')}
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {t('quiz_page.usage_limit_note')}
          </p>
        </footer>
      </div>
    </div>
  )
}
