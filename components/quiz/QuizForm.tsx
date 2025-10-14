'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { useTranslation } from 'react-i18next';

export interface QuizFormData {
    careerMoment: string
    mentorshipExperience: string
    developmentAreas: string[]
    developmentAreasOther?: string
    currentChallenge: string
    futureVision: string
    shareKnowledge: string
    personalLifeHelp: string
    name: string
    email: string
    linkedinUrl?: string
}

interface QuizFormProps {
    onSubmit: (data: QuizFormData) => Promise<void>
    onBack: () => void
}

export function QuizForm({ onSubmit, onBack }: QuizFormProps) {
    const { t } = useTranslation('quiz');
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<Partial<QuizFormData>>({
        developmentAreas: []
    })

    const totalSteps = 8
    const progress = (currentStep / totalSteps) * 100

    const updateFormData = (field: keyof QuizFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const toggleDevelopmentArea = (area: string) => {
        const current = formData.developmentAreas || []
        if (current.includes(area)) {
            updateFormData('developmentAreas', current.filter(a => a !== area))
        } else {
            updateFormData('developmentAreas', [...current, area])
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return !!formData.careerMoment
            case 2:
                return !!formData.currentChallenge && formData.currentChallenge.trim().length > 10
            case 3:
                return !!formData.mentorshipExperience
            case 4:
                return !!formData.futureVision && formData.futureVision.trim().length > 10
            case 5:
                return formData.developmentAreas && formData.developmentAreas.length > 0
            case 6:
                return !!formData.personalLifeHelp && formData.personalLifeHelp.trim().length > 10
            case 7:
                return !!formData.shareKnowledge
            case 8:
                return !!formData.name && !!formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
            default:
                return false
        }
    }

    const handleNext = () => {
        if (canProceed() && currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
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

    const renderQuestion = () => {
        switch (currentStep) {
            case 1:
                return (
                    <RadioGroup
                        value={formData.careerMoment}
                        onValueChange={(value) => updateFormData('careerMoment', value)}
                        className="space-y-3"
                    >
                        {[
                            { value: 'ensino-medio', label: t('quiz_form.high_school_student') },
                            { value: 'estudante-universitario', label: t('quiz_form.university_student') },
                            { value: 'recem-formado', label: t('quiz_form.recent_graduate') },
                            { value: 'profissional-junior', label: t('quiz_form.junior_professional') },
                            { value: 'transicao', label: t('quiz_form.career_transition') },
                            { value: 'outro', label: t('quiz_form.other') },
                        ].map((option) => (
                            <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                                <RadioGroupItem value={option.value} id={option.value} />
                                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )

            case 2:
                return (
                    <div className="space-y-4">
                        <TextareaWithVoice
                            placeholder={t('quiz_form.challenge_placeholder')}
                            value={formData.currentChallenge || ''}
                            onChange={(value) => updateFormData('currentChallenge', value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('quiz_form.min_chars')} • {formData.currentChallenge?.length || 0} {t('quiz_form.chars')}
                        </p>
                    </div>
                )

            case 3:
                return (
                    <RadioGroup
                        value={formData.mentorshipExperience}
                        onValueChange={(value) => updateFormData('mentorshipExperience', value)}
                        className="space-y-3"
                    >
                        {[
                            { value: 'sim-util', label: t('quiz_form.mentorship_yes_useful') },
                            { value: 'sim-nao-boa', label: t('quiz_form.mentorship_yes_not_good') },
                            { value: 'nao-interesse', label: t('quiz_form.mentorship_no_interest') },
                            { value: 'nao-sei', label: t('quiz_form.mentorship_no_dont_know') },
                            { value: 'ouvi-falar', label: t('quiz_form.mentorship_heard_about_it') },
                        ].map((option) => (
                            <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                                <RadioGroupItem value={option.value} id={option.value} />
                                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )

            case 4:
                return (
                    <div className="space-y-4">
                        <TextareaWithVoice
                            placeholder={t('quiz_form.future_vision_placeholder')}
                            value={formData.futureVision || ''}
                            onChange={(value) => updateFormData('futureVision', value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('quiz_form.min_chars')} • {formData.futureVision?.length || 0} {t('quiz_form.chars')}
                        </p>
                    </div>
                )

            case 5:
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">{t('quiz_form.select_all_that_apply')}</p>
                        {[
                            { value: 'Desenvolvimento técnico', label: t('quiz_form.technical_development') },
                            { value: 'Comunicação e networking', label: t('quiz_form.communication_networking') },
                            { value: 'Liderança e gestão', label: t('quiz_form.leadership_management') },
                            { value: 'Planejamento de carreira', label: t('quiz_form.career_planning') },
                            { value: 'Empreendedorismo', label: t('quiz_form.entrepreneurship') },
                            { value: 'Equilíbrio vida pessoal/profissional', label: t('quiz_form.work_life_balance') },
                        ].map((option) => (
                            <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                                <Checkbox
                                    id={option.value}
                                    checked={formData.developmentAreas?.includes(option.value)}
                                    onCheckedChange={() => toggleDevelopmentArea(option.value)}
                                />
                                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                        <div className="pt-2">
                            <Label htmlFor="other-area" className="text-sm">{t('quiz_form.other_area_specify')}</Label>
                            <Input
                                id="other-area"
                                placeholder={t('quiz_form.other_area_placeholder')}
                                value={formData.developmentAreasOther || ''}
                                onChange={(e) => updateFormData('developmentAreasOther', e.target.value)}
                                className="mt-2"
                            />
                        </div>
                    </div>
                )

            case 6:
                return (
                    <div className="space-y-4">
                        <TextareaWithVoice
                            placeholder={t('quiz_form.personal_life_placeholder')}
                            value={formData.personalLifeHelp || ''}
                            onChange={(value) => updateFormData('personalLifeHelp', value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('quiz_form.min_chars')} • {formData.personalLifeHelp?.length || 0} {t('quiz_form.chars')}
                        </p>
                    </div>
                )

            case 7:
                return (
                    <RadioGroup
                        value={formData.shareKnowledge}
                        onValueChange={(value) => updateFormData('shareKnowledge', value)}
                        className="space-y-3"
                    >
                        {[
                            { value: 'sim-muito', label: t('quiz_form.share_knowledge_yes_very') },
                            { value: 'sim-talvez', label: t('quiz_form.share_knowledge_yes_maybe') },
                            { value: 'nao-pensou', label: t('quiz_form.share_knowledge_no_never_thought') },
                            { value: 'nao-tempo', label: t('quiz_form.share_knowledge_no_time') },
                            { value: 'ja-faco', label: t('quiz_form.share_knowledge_already_do') },
                        ].map((option) => (
                            <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                                <RadioGroupItem value={option.value} id={option.value} />
                                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )

            case 8:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('quiz_form.full_name')}</Label>
                            <Input
                                id="name"
                                placeholder={t('quiz_form.full_name_placeholder')}
                                value={formData.name || ''}
                                onChange={(e) => updateFormData('name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('quiz_form.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t('quiz_form.email_placeholder')}
                                value={formData.email || ''}
                                onChange={(e) => updateFormData('email', e.target.value)}
                            />
                            {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                                <p className="text-xs text-destructive">{t('quiz_form.invalid_email')}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">{t('quiz_form.linkedin_optional')}</Label>
                            <Input
                                id="linkedin"
                                placeholder={t('quiz_form.linkedin_placeholder')}
                                value={formData.linkedinUrl || ''}
                                onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                {t('quiz_form.analysis_notification')}
                            </p>
                        </div>
                    </div>
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
                                {t('quiz_form.progress_header', { currentStep, totalSteps })}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Question Card */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {currentStep === 1 && t('quiz_form.career_moment_title')}
                                {currentStep === 2 && t('quiz_form.professional_challenge_title')}
                                {currentStep === 3 && t('quiz_form.mentorship_experience_title')}
                                {currentStep === 4 && t('quiz_form.future_vision_title')}
                                {currentStep === 5 && t('quiz_form.development_areas_title')}
                                {currentStep === 6 && t('quiz_form.personal_life_challenges_title')}
                                {currentStep === 7 && t('quiz_form.share_knowledge_title')}
                                {currentStep === 8 && t('quiz_form.contact_information_title')}
                            </CardTitle>
                            <CardDescription>
                                {currentStep === 1 && t('quiz_form.career_moment_description')}
                                {currentStep === 2 && t('quiz_form.professional_challenge_description')}
                                {currentStep === 3 && t('quiz_form.mentorship_experience_description')}
                                {currentStep === 4 && t('quiz_form.future_vision_description')}
                                {currentStep === 5 && t('quiz_form.development_areas_description')}
                                {currentStep === 6 && t('quiz_form.personal_life_challenges_description')}
                                {currentStep === 7 && t('quiz_form.share_knowledge_description')}
                                {currentStep === 8 && t('quiz_form.contact_information_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Question content */}
                            <div className="min-h-[300px]">
                                {renderQuestion()}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-3 pt-4">
                                {currentStep < totalSteps ? (
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

                    {/* Help text */}
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        {t('quiz_form.confidential_responses')}
                    </p>
                </div>
            </div>
        </AnimatedBackground>
    )
}
