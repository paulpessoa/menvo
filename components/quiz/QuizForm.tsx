'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

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
                return !!formData.mentorshipExperience
            case 3:
                return formData.developmentAreas && formData.developmentAreas.length > 0
            case 4:
                return !!formData.currentChallenge && formData.currentChallenge.trim().length > 10
            case 5:
                return !!formData.futureVision && formData.futureVision.trim().length > 10
            case 6:
                return !!formData.shareKnowledge
            case 7:
                return !!formData.personalLifeHelp && formData.personalLifeHelp.trim().length > 10
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
                            { value: 'estudante-inicio', label: 'Estudante universitário (início do curso)' },
                            { value: 'estudante-meio-fim', label: 'Estudante universitário (meio/fim do curso)' },
                            { value: 'recem-formado', label: 'Recém-formado (até 1 ano)' },
                            { value: 'profissional-junior', label: 'Profissional júnior (1-3 anos de experiência)' },
                            { value: 'transicao', label: 'Em transição de carreira' },
                            { value: 'outro', label: 'Outro' },
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
                    <RadioGroup
                        value={formData.mentorshipExperience}
                        onValueChange={(value) => updateFormData('mentorshipExperience', value)}
                        className="space-y-3"
                    >
                        {[
                            { value: 'sim-util', label: 'Sim, já fui mentorado e foi muito útil' },
                            { value: 'sim-nao-boa', label: 'Sim, mas não foi uma boa experiência' },
                            { value: 'nao-interesse', label: 'Não, mas tenho muito interesse' },
                            { value: 'nao-sei', label: 'Não, e ainda não sei se preciso' },
                            { value: 'ouvi-falar', label: 'Já ouvi falar, mas nunca participei' },
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

            case 3:
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">Selecione todas que se aplicam:</p>
                        {[
                            { value: 'Desenvolvimento técnico', label: 'Desenvolvimento técnico (hard skills)' },
                            { value: 'Comunicação e networking', label: 'Comunicação e networking' },
                            { value: 'Liderança e gestão', label: 'Liderança e gestão' },
                            { value: 'Planejamento de carreira', label: 'Planejamento de carreira' },
                            { value: 'Empreendedorismo', label: 'Empreendedorismo' },
                            { value: 'Equilíbrio vida pessoal/profissional', label: 'Equilíbrio vida pessoal/profissional' },
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
                            <Label htmlFor="other-area" className="text-sm">Outro (especifique):</Label>
                            <Input
                                id="other-area"
                                placeholder="Digite outra área de interesse..."
                                value={formData.developmentAreasOther || ''}
                                onChange={(e) => updateFormData('developmentAreasOther', e.target.value)}
                                className="mt-2"
                            />
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Conte-nos sobre o que mais te preocupa ou desafia na sua carreira..."
                            value={formData.currentChallenge || ''}
                            onChange={(e) => updateFormData('currentChallenge', e.target.value)}
                            className="min-h-[200px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mínimo de 10 caracteres • {formData.currentChallenge?.length || 0} caracteres
                        </p>
                    </div>
                )

            case 5:
                return (
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Compartilhe sua visão de futuro profissional..."
                            value={formData.futureVision || ''}
                            onChange={(e) => updateFormData('futureVision', e.target.value)}
                            className="min-h-[200px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mínimo de 10 caracteres • {formData.futureVision?.length || 0} caracteres
                        </p>
                    </div>
                )

            case 6:
                return (
                    <RadioGroup
                        value={formData.shareKnowledge}
                        onValueChange={(value) => updateFormData('shareKnowledge', value)}
                        className="space-y-3"
                    >
                        {[
                            { value: 'sim-muito', label: 'Sim, tenho muito interesse em compartilhar' },
                            { value: 'sim-talvez', label: 'Sim, talvez no futuro' },
                            { value: 'nao-pensou', label: 'Não, nunca pensei nisso' },
                            { value: 'nao-tempo', label: 'Gostaria, mas não tenho tempo' },
                            { value: 'ja-faco', label: 'Já faço isso de alguma forma' },
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

            case 7:
                return (
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Exemplo: Encontrar um novo hobby, desenvolver projetos pessoais, melhorar relacionamentos, cuidar da saúde mental..."
                            value={formData.personalLifeHelp || ''}
                            onChange={(e) => updateFormData('personalLifeHelp', e.target.value)}
                            className="min-h-[200px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mínimo de 10 caracteres • {formData.personalLifeHelp?.length || 0} caracteres
                        </p>
                    </div>
                )

            case 8:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo *</Label>
                            <Input
                                id="name"
                                placeholder="Seu nome completo"
                                value={formData.name || ''}
                                onChange={(e) => updateFormData('name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.email || ''}
                                onChange={(e) => updateFormData('email', e.target.value)}
                            />
                            {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                                <p className="text-xs text-destructive">Email inválido</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn (opcional)</Label>
                            <Input
                                id="linkedin"
                                placeholder="https://linkedin.com/in/seu-perfil"
                                value={formData.linkedinUrl || ''}
                                onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                Enviaremos sua análise personalizada para este email, junto com um convite para a plataforma MENVO.
                            </p>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                                Voltar
                            </Button>
                            <span className="text-sm font-medium text-muted-foreground">
                                Pergunta {currentStep} de {totalSteps}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Question Card */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {currentStep === 1 && 'Qual é o seu momento de carreira atual?'}
                                {currentStep === 2 && 'Você já teve alguma experiência com mentoria?'}
                                {currentStep === 3 && 'Quais áreas você mais gostaria de desenvolver?'}
                                {currentStep === 4 && 'Qual é o seu maior desafio profissional no momento?'}
                                {currentStep === 5 && 'Onde você se vê daqui a 2 anos?'}
                                {currentStep === 6 && 'Você já pensou em compartilhar seu conhecimento ou experiência com outros?'}
                                {currentStep === 7 && 'Em quais desafios da vida pessoal uma conversa poderia te ajudar?'}
                                {currentStep === 8 && 'Informações de Contato'}
                            </CardTitle>
                            <CardDescription>
                                {currentStep === 1 && 'Selecione a opção que melhor descreve seu momento atual'}
                                {currentStep === 2 && 'Queremos entender sua experiência prévia com mentoria'}
                                {currentStep === 3 && 'Você pode selecionar múltiplas opções'}
                                {currentStep === 4 && 'Conte-nos sobre o que mais te preocupa ou desafia na sua carreira'}
                                {currentStep === 5 && 'Compartilhe sua visão de futuro profissional'}
                                {currentStep === 6 && 'Queremos saber se você também tem interesse em ajudar outras pessoas'}
                                {currentStep === 7 && 'Como novos hobbies, projetos pessoais ou outros aspectos da vida'}
                                {currentStep === 8 && 'Para enviarmos sua análise personalizada'}
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
                                        Próxima
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
                                                Processando...
                                            </>
                                        ) : (
                                            'Finalizar e Ver Resultado'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Help text */}
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Suas respostas são confidenciais e serão usadas apenas para gerar sua análise personalizada
                    </p>
                </div>
            </div>
        </div>
    )
}
