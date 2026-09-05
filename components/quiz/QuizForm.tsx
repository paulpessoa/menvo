'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { AnimatedBackground } from '@/components/ui/animated-background'
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
}

const TOTAL_STEPS = 8

export function QuizForm({ onSubmit, onBack, initialData }: QuizFormProps) {
  const t = useTranslations('quiz')
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<QuizFormData>>({
    developmentAreas: [],
    ...initialData
  })

  const progress = (currentStep / TOTAL_STEPS) * 100

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
    if (canProceed() && currentStep < TOTAL_STEPS) {
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
      await onSubmit(formData as QuizFormData)
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
          <QuizRadioStep
            value={formData.careerMoment}
            onChange={(val) => updateFormData('careerMoment', val)}
            options={[
              { value: 'ensino-medio', label: t('quiz_form.high_school_student') },
              { value: 'estudante-universitario', label: t('quiz_form.university_student') },
              { value: 'recem-formado', label: t('quiz_form.recent_graduate') },
              { value: 'profissional-junior', label: t('quiz_form.junior_professional') },
              { value: 'transicao', label: t('quiz_form.career_transition') },
              { value: 'outro', label: t('quiz_form.other') },
            ]}
          />
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

  return (
    <AnimatedBackground>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={currentStep === 1 ? onBack : handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('quiz_form.back')}
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {t('quiz_form.progress_header', { currentStep, totalSteps: TOTAL_STEPS })}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">
                {stepTitles[currentStep]?.title}
              </CardTitle>
              <CardDescription>
                {stepTitles[currentStep]?.desc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[300px]">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep < TOTAL_STEPS ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex-1"
                    size="lg"
                  >
                    {t('quiz_form.next')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('quiz_form.confidential_responses')}
          </p>
        </div>
      </div>
    </AnimatedBackground>
  )
}
