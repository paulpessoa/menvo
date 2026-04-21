"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Send, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"

export default function FeedbackPage() {
  const t = useTranslations("feedback")
  const common = useTranslations("common")
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error(common("loginRequired"))
      router.push("/login")
      return
    }

    if (rating === 0) {
      toast.error("Por favor, selecione uma nota.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          user_id: user?.id,
          page_url: "/feedback"
        })
      })

      if (!response.ok) throw new Error("Falha ao enviar feedback")

      setSubmitted(true)
      toast.success("Obrigado pelo seu feedback!")
    } catch (error) {
      console.error("Feedback error:", error)
      toast.error("Ocorreu um erro ao enviar seu feedback.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-6 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Login Necessário</CardTitle>
            <CardDescription>
              Você precisa estar logado para enviar um feedback e nos ajudar a
              melhorar o Menvo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full h-12 text-lg">
              <Link href="/login">Fazer Login</Link>
            </Button>
            <Button variant="outline" asChild className="w-full h-12 text-lg">
              <Link href="/signup">Criar Conta Grátis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 border-2 border-green-100 bg-green-50/30 shadow-xl">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-bold mb-4">Valeu!</CardTitle>
          <CardDescription className="text-lg">
            Seu feedback foi registrado. O Paulo e o time do Menvo agradecem sua
            colaboração para tornar esta plataforma incrível.
          </CardDescription>
          <Button asChild className="mt-8 w-full h-12" variant="outline">
            <Link href="/dashboard">Voltar para o Dashboard</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
          </Link>
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Sua opinião é vital
          </h1>
          <p className="text-xl text-muted-foreground">
            O que você está achando da experiência no Menvo até agora?
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center border-b bg-muted/20">
              <CardTitle>Avaliação Geral</CardTitle>
              <CardDescription>
                Clique nas estrelas para avaliar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-12 w-12 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Label htmlFor="comment" className="text-lg font-semibold">
                  Comentários Adicionais
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Sugestões, críticas ou elogios... sinta-se à vontade!"
                  className="min-h-[150px] text-lg p-4 resize-none"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-muted/10 border-t">
              <Button
                type="submit"
                className="w-full h-14 text-xl shadow-xl hover:scale-[1.01] transition-transform"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />{" "}
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" /> Enviar Feedback
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
