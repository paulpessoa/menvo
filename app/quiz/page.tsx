"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Gift, Sparkles, Users, Target, Clock } from "lucide-react"
import { QuizForm, QuizFormData } from "@/components/quiz/QuizForm"
import { useToast } from "@/hooks/use-toast"
import { AnimatedBackground } from "@/components/ui/animated-background"

export default function QuizPage() {
  const [showQuiz, setShowQuiz] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleQuizSubmit = async (data: QuizFormData) => {
    try {
      const { createClient } = await import("@/utils/supabase/client")
      const supabase = createClient()

      // Save quiz response to database
      const { data: response, error } = await supabase
        .from("quiz_responses")
        .insert({
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
        .select()
        .single()

      if (error) {
        throw error
      }

      // Send invite email (fire and forget)
      supabase.functions
        .invoke("send-invite-email", {
          body: {
            name: data.name,
            email: data.email
          }
        })
        .catch((err) => console.error("Error sending invite:", err))

      toast({
        title: "Questionário enviado!",
        description: "Processando sua análise com IA..."
      })

      // Call Edge Function to process with AI
      const { data: analysisData, error: analysisError } =
        await supabase.functions.invoke("analyze-quiz", {
          body: { responseId: response.id }
        })

      if (analysisError) {
        console.error("Error analyzing quiz:", analysisError)
        // Still redirect even if analysis fails - it can be retried
      }

      // Redirect to results page with response ID
      router.push(`/quiz/results/${response.id}`)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Erro",
        description:
          "Não foi possível processar o questionário. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  if (showQuiz) {
    return (
      <QuizForm onSubmit={handleQuizSubmit} onBack={() => setShowQuiz(false)} />
    )
  }

  return (
    <AnimatedBackground>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-6">
            <h1
              className="text-3xl md:text-4xl font-bold"
              style={{ color: "#007585" }}
            >
              Descubra Seu Potencial de Crescimento
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Responda nosso questionário rápido e receba uma análise
              personalizada com sugestões de mentores ideais para sua jornada.
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <CardHeader>
                <Target className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Análise Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Receba insights sobre seu momento de carreira e áreas de
                  desenvolvimento
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Mentores Ideais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Descubra quais tipos de mentores podem te ajudar a alcançar
                  seus objetivos
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-300 dark:hover:border-green-700 transition-colors">
              <CardHeader>
                <Gift className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Ganhe um Brinde!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pontuação acima de 700? Escolha entre caneta ou botton
                  exclusivo!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main CTA Card */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardContent className="space-y-6">
              <Button
                size="lg"
                className="w-full text-lg mt-8 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowQuiz(true)}
              >
                Começar Questionário
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Suas respostas nos ajudarão a entender melhor as necessidades
                dos participantes e a recrutar mentores voluntários nas áreas
                mais procuradas. Além de contribuir para construir uma
                comunidade de mentoria mais forte e acessível.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  )
}
