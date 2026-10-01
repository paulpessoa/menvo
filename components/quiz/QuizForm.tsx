'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react"
import { useTranslations } from 'next-intl'
import { QuizFormData, stepValidation } from '@/lib/schemas/quiz'
import { QuizRadioStep } from './steps/QuizRadioStep'
import { QuizVoiceTextareaStep } from './steps/QuizVoiceTextareaStep'
import { QuizAreasStep } from './steps/QuizAreasStep'
import { QuizContactStep } from './steps/QuizContactStep'

export type { QuizFormData }

interface QuizFormProps {
  onSubmit: (data: QuizFormData) => Promise<void>
  onBack: () => void
  initialData?: Partial<QuizFormData>
  isAuthenticated?: boolean
}

export function QuizForm({ onSubmit, onBack, initialData, isAuthenticated = false }: QuizFormProps) {
  const t = useTranslations('quiz')
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<QuizFormData>>({
    developmentAreas: [],
    ...initialData
  })

  const totalSteps = isAuthenticated ? 7 : 8
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = useCallback(<K extends keyof QuizFormData>(field: K, value: QuizFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const toggleDevelopmentArea = useCallback((area: string) => {
    setFormData((prev) => {
      const current = prev.developmentAreas || []
      const updated = current.includes(area)
        ? current.filter((a) => a !== area)
        : [...current, area]
      return { ...prev, developmentAreas: updated }
    })
  }, [])

  const canProceed = useCallback(() => {
    const validator = stepValidation[currentStep as keyof typeof stepValidation]
    return validator ? validator(formData) : false
  }, [currentStep, formData])

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setIsSubmitting(true)
    try {
      const finalData: QuizFormData = {
        name: formData.name || initialData?.name || 'Mentorado',
        email: formData.email || initialData?.email || '',
        linkedinUrl: formData.linkedinUrl || initialData?.linkedinUrl || '',
        careerMoment: formData.careerMoment!,
        currentChallenge: formData.currentChallenge!,
        mentorshipExperience: formData.mentorshipExperience!,
        futureVision: formData.futureVision!,
        developmentAreas: formData.developmentAreas || [],
        personalLifeHelp: formData.personalLifeHelp!,
        shareKnowledge: formData.shareKnowledge!,
      }
      await onSubmit(finalData)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepTitles: Record<number, { title: string; desc: string }> = {
    1: { title: t('quiz_form.career_moment_title'), desc: t('quiz_form.career_moment_description') },
    2: { title: t('quiz_form.professional_challenge_title'), desc: t('quiz_form.professional_challenge_description') },
    3: { title: t('quiz_form.mentorship_experience_title'), desc: t('quiz_form.mentorship_experience_description') },
    4: { title: t('quiz_form.future_vision_title'), desc: t('quiz_form.future_vision_description') },
    5: { title: t('quiz_form.development_areas_title'), desc: t('quiz_form.development_areas_description') },
    6: { title: t('quiz_form.personal_life_challenges_title'), desc: t('quiz_form.personal_life_challenges_description') },
    7: { title: t('quiz_form.share_knowledge_title'), desc: t('quiz_form.share_knowledge_description') },
    8: { title: t('quiz_form.contact_information_title'), desc: t('quiz_form.contact_information_description') },
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <QuizRadioStep
              value={(formData.careerMoment || '').startsWith('outro') ? 'outro' : formData.careerMoment}
              onChange={(val) => {
                if (val === 'outro') {
                  updateFormData('careerMoment', 'outro:')
                } else {
                  updateFormData('careerMoment', val)
                }
              }}
              options={[
                { value: 'ensino-medio', label: t('quiz_form.high_school_student') },
                { value: 'estudante-universitario', label: t('quiz_form.university_student') },
                { value: 'recem-formado', label: t('quiz_form.recent_graduate') },
                { value: 'profissional-junior', label: t('quiz_form.junior_professional') },
                { value: 'transicao', label: t('quiz_form.career_transition') },
                { value: 'outro', label: t('quiz_form.other') },
              ]}
            />
            {(formData.careerMoment || '').startsWith('outro') && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Input
                  autoFocus
                  placeholder={t('quiz_form.other_placeholder') || 'Especifique seu momento...'}
                  value={(formData.careerMoment || '').replace(/^outro:/, '')}
                  onChange={(e) => updateFormData('careerMoment', `outro:${e.target.value}`)}
                  className="h-12 bg-white"
                />
              </div>
            )}
          </div>
        )
      case 2:
        return (
          <QuizVoiceTextareaStep
            value={formData.currentChallenge}
            onChange={(val) => updateFormData('currentChallenge', val)}
            placeholder={t('quiz_form.challenge_placeholder')}
            minCharsLabel={t('quiz_form.min_chars')}
            charsLabel={t('quiz_form.chars')}
          />
        )
      case 3:
        return (
          <QuizRadioStep
            value={formData.mentorshipExperience}
            onChange={(val) => updateFormData('mentorshipExperience', val)}
            options={[
              { value: 'sim-util', label: t('quiz_form.mentorship_yes_useful') },
              { value: 'sim-nao-boa', label: t('quiz_form.mentorship_yes_not_good') },
              { value: 'nao-interesse', label: t('quiz_form.mentorship_no_interest') },
              { value: 'nao-sei', label: t('quiz_form.mentorship_no_dont_know') },
              { value: 'ouvi-falar', label: t('quiz_form.mentorship_heard_about_it') },
            ]}
          />
        )
      case 4:
        return (
          <QuizVoiceTextareaStep
            value={formData.futureVision}
            onChange={(val) => updateFormData('futureVision', val)}
            placeholder={t('quiz_form.future_vision_placeholder')}
            minCharsLabel={t('quiz_form.min_chars')}
            charsLabel={t('quiz_form.chars')}
          />
        )
      case 5:
        return (
          <QuizAreasStep
            selectedAreas={formData.developmentAreas}
            otherArea={formData.developmentAreasOther}
            onToggleArea={toggleDevelopmentArea}
            onChangeOther={(val) => updateFormData('developmentAreasOther', val)}
            selectAllText={t('quiz_form.select_all_that_apply')}
            otherAreaSpecifyText={t('quiz_form.other_area_specify')}
            otherAreaPlaceholder={t('quiz_form.other_area_placeholder')}
            options={[
              { value: 'Desenvolvimento técnico', label: t('quiz_form.technical_development') },
              { value: 'Comunicação e networking', label: t('quiz_form.communication_networking') },
              { value: 'Liderança e gestão', label: t('quiz_form.leadership_management') },
              { value: 'Planejamento de carreira', label: t('quiz_form.career_planning') },
              { value: 'Empreendedorismo', label: t('quiz_form.entrepreneurship') },
              { value: 'Equilíbrio vida pessoal/profissional', label: t('quiz_form.work_life_balance') },
            ]}
          />
        )
      case 6:
        return (
          <QuizVoiceTextareaStep
            value={formData.personalLifeHelp}
            onChange={(val) => updateFormData('personalLifeHelp', val)}
            placeholder={t('quiz_form.personal_life_placeholder')}
            minCharsLabel={t('quiz_form.min_chars')}
            charsLabel={t('quiz_form.chars')}
          />
        )
      case 7:
        return (
          <QuizRadioStep
            value={formData.shareKnowledge}
            onChange={(val) => updateFormData('shareKnowledge', val)}
            options={[
              { value: 'sim-muito', label: t('quiz_form.share_knowledge_yes_very') },
              { value: 'sim-talvez', label: t('quiz_form.share_knowledge_yes_maybe') },
              { value: 'nao-pensou', label: t('quiz_form.share_knowledge_no_never_thought') },
              { value: 'nao-tempo', label: t('quiz_form.share_knowledge_no_time') },
              { value: 'ja-faco', label: t('quiz_form.share_knowledge_already_do') },
            ]}
          />
        )
      case 8:
        return (
          <QuizContactStep
            name={formData.name}
            email={formData.email}
            linkedinUrl={formData.linkedinUrl}
            onChangeField={updateFormData}
            fullNameLabel={t('quiz_form.full_name')}
            fullNamePlaceholder={t('quiz_form.full_name_placeholder')}
            emailLabel={t('quiz_form.email')}
            emailPlaceholder={t('quiz_form.email_placeholder')}
            invalidEmailText={t('quiz_form.invalid_email')}
            linkedinLabel={t('quiz_form.linkedin_optional')}
            linkedinPlaceholder={t('quiz_form.linkedin_placeholder')}
            notificationText={t('quiz_form.analysis_notification')}
            isEmailInvalid={Boolean(formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))}
          />
        )
      default:
        return null
    }
  }

  // Mesma linguagem visual da página de resultados: fundo em degradê accent,
  // cabeçalho editorial com divisória e conteúdo em cartões rounded-2xl.
  return (
    <div className="bg-gradient-to-b from-accent/70 via-background to-background">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 md:pt-12">
        {/* Progresso */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 rounded-xl"
            onClick={currentStep === 1 ? onBack : handlePrevious}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t('quiz_form.back')}
          </Button>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t('quiz_form.progress_header', { currentStep, totalSteps })}
          </p>
        </div>
        <Progress
          value={progress}
          className="mt-3 h-2"
          aria-label={t('quiz_form.progress_header', { currentStep, totalSteps })}
        />

        {/* Pergunta */}
        <header className="mt-8 border-b pb-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
            {stepTitles[currentStep]?.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {stepTitles[currentStep]?.desc}
          </p>
        </header>

        <div className="mt-8 min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navegação */}
        <div className="mt-8 space-y-3">
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="h-12 w-full rounded-xl text-base font-bold"
              size="lg"
            >
              {t('quiz_form.next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="h-12 w-full rounded-xl text-base font-bold"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('quiz_form.processing')}
                </>
              ) : (
                t('quiz_form.submit')
              )}
            </Button>
          )}
          {isAuthenticated && currentStep === totalSteps && (
            <p className="text-center text-xs text-muted-foreground">
              {t('quiz_form.submit_auth_note')}
            </p>
          )}
        </div>

        <footer className="mt-10 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {t('quiz_form.confidential_responses')}
          </p>
        </footer>
      </div>
    </div>
  )
}
