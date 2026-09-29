"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquarePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
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
  const feedbackEnabled = true
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
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-105 transition-transform group">
        <div className="relative flex items-center justify-center rounded-full p-[2px] overflow-hidden shadow-2xl bg-primary">
          {/* Borda giratória */}
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div
              className="w-[300%] aspect-square animate-[spin_3s_linear_infinite]"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0 270deg, rgba(255,255,255,0.9) 360deg)'
              }}
            />
          </div>
          {/* Botão interno */}
          <Button
            onClick={() => setIsOpen(true)}
            className="relative z-10 flex items-center gap-2 rounded-full bg-primary hover:bg-primary/95 px-5 h-12 border-none transition-colors"
            size="default"
            aria-label="Reclame aqui"
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span className="font-bold text-sm tracking-wider">Reclame Aqui</span>
          </Button>
        </div>
      </div>

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
              <DialogHeader className="text-center sm:text-center space-y-3 pb-2">
                <DialogTitle className="text-2xl font-bold">Manda a real!</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Não se acanhe! Se você criticar, vou ler, aprender com isso e tentar melhorar.
                  Sua opinião fará parte desse impacto na sociedade.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className={`p-2 rounded-lg transition-all ${rating === num ? 'bg-primary text-white scale-110' : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                      <Star className={`h-8 w-8 ${rating === num ? 'fill-current' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Conta tudo (não esconde nada):</p>
                  <TextareaWithVoice
                    placeholder="Pode descer a lenha ou rasgar seda, o espaço é seu..."
                    value={comment}
                    onChange={(val) => setComment(val)}
                    minHeight="min-h-[100px]"
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full font-bold text-base h-11"
                  disabled={isSubmitting || !rating}
                >
                  {isSubmitting ? "Enviando pra gente..." : "Soltar o verbo!"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
