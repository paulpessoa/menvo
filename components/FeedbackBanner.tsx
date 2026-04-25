"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { useFeatureFlag } from "@/lib/feature-flags"

/**
 * FeedbackBanner
 * Exibe um balão flutuante para coletar feedback rápido dos usuários.
 * Controlado pela Feature Flag 'feedbackEnabled'.
 */
export function FeedbackBanner() {
  const t = useTranslations()
  const { isAuthenticated } = useAuth()
  const feedbackEnabled = useFeatureFlag("feedback_app_flag")
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota de 1 a 5.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment })
      })

      if (!response.ok) throw new Error("Falha ao enviar")

      setShowThankYou(true)
      setRating(null)
      setComment("")
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em instantes.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || !feedbackEnabled) return null

  return (
    <>
      {/* Botão Flutuante */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-primary hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Modal de Feedback */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {showThankYou ? (
            <div className="py-10 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-green-600 fill-green-600" />
              </div>
              <DialogTitle>Obrigado pelo seu feedback!</DialogTitle>
              <DialogDescription>
                Sua opinião é fundamental para construirmos uma Menvo melhor.
              </DialogDescription>
              <Button onClick={() => setIsOpen(false)} className="w-full">Fechar</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>O que você está achando da Menvo?</DialogTitle>
                <DialogDescription>
                  Sua avaliação ajuda a melhorar a experiência de mentoria para todos.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-6 space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className={`p-2 rounded-lg transition-all ${
                        rating === num ? 'bg-primary text-white scale-110' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Star className={`h-8 w-8 ${rating === num ? 'fill-current' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Conte-nos mais (opcional)</p>
                  <Textarea
                    placeholder="Elogios, críticas ou sugestões..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  disabled={isSubmitting || !rating}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Feedback"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
