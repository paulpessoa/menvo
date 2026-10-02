"use client"

import { useState, useEffect, useRef } from "react"
import { Star, MessageSquarePlus, Video, Play } from "lucide-react"
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
  const [showVideoPrompt, setShowVideoPrompt] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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
      // Se enviou, não precisa mais ver o vídeo de cobrança
      localStorage.setItem("hasSeenFeedbackVideoPrompt", "true")
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // O usuário está tentando fechar o modal
      if (!showThankYou && !showVideoPrompt) {
        // Se ainda não opinou e não está vendo o prompt de vídeo
        const hasSeenVideo = localStorage.getItem("hasSeenFeedbackVideoPrompt")
        if (hasSeenVideo !== "true") {
          // Intercepta o fechamento e mostra o vídeo de motivação
          setShowVideoPrompt(true)
          return
        }
      }
    } else {
      // Resetar estados quando abrir o modal novamente
      setShowVideoPrompt(false)
      setShowThankYou(false)
      setIsPlaying(false)
    }

    // Se for um fechamento definitivo (já viu o vídeo ou já opinou)
    if (!open && showVideoPrompt) {
      localStorage.setItem("hasSeenFeedbackVideoPrompt", "true")
      setShowVideoPrompt(false)
      setIsPlaying(false)
    }

    setIsOpen(open)
  }

  const closeDefinitely = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem("hasSeenFeedbackVideoPrompt", "true")
    // Hide for 30 days
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000
    localStorage.setItem("hideFeedbackBannerUntil", until.toString())
    setShowVideoPrompt(false)
    setIsPlaying(false)
    setIsOpen(false)
    setMounted(false) // immediately hide
  }

  if (!mounted || !feedbackEnabled) return null

  const hiddenUntilStr = typeof window !== "undefined" ? localStorage.getItem("hideFeedbackBannerUntil") : null
  const hiddenUntil = hiddenUntilStr ? parseInt(hiddenUntilStr, 10) : 0
  if (hiddenUntil > Date.now()) return null

  return (
    <>
      {/* Botão Flutuante (apenas mobile) */}
      <div className="fixed bottom-6 right-6 z-50 flex md:hidden flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-105 transition-transform group">
        <button 
          onClick={closeDefinitely}
          className="bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground rounded-full p-2 shadow-md border border-border bg-white text-xs z-50 mr-1"
          aria-label="Não exibir por 30 dias"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
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
            className="relative z-10 flex items-center gap-2 rounded-full bg-primary hover:bg-primary/95 px-3 md:px-5 h-12 border-none transition-colors"
            size="default"
            aria-label="Reclame aqui"
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span className="font-bold text-sm tracking-wider hidden md:inline">Reclame Aqui</span>
          </Button>
        </div>
      </div>

      {/* Modal de Feedback */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          {showVideoPrompt ? (
            <div className="space-y-4 py-2">
              <DialogTitle className="sr-only">Recado rápido</DialogTitle>

              {/* Vídeo de Onboarding */}
              <div
                className="aspect-[9/16] max-h-[70vh] w-full bg-black rounded-lg flex flex-col items-center justify-center border-2 border-muted relative overflow-hidden shadow-inner cursor-pointer group"
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause()
                      setIsPlaying(false)
                    } else {
                      videoRef.current.play()
                      setIsPlaying(true)
                    }
                  }
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  className="w-full h-full object-cover"
                  onEnded={() => setIsPlaying(false)}
                >
                  <source src="/feedback-onboarding.webm" type="video/webm" />
                  <source src="/feedback-onboarding.mp4" type="video/mp4" />
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>

                {/* Overlay de Play Centralizado */}
                {!isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/50">
                    <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">

                <Button className="flex-1 font-bold" onClick={() => setShowVideoPrompt(false)}>
                  Escrever / Falar
                </Button>
              </div>
            </div>
          ) : showThankYou ? (
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
                  Se você criticar, reclamar ou elogiar, vou ler, aprender com isso e tentar melhorar.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className={`p-2 rounded-lg transition-all ${rating !== null && num <= rating ? 'bg-primary text-white scale-110' : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                      <Star className={`h-8 w-8 ${rating !== null && num <= rating ? 'fill-current' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Conta tudo (não esconde nada):</p>
                  <TextareaWithVoice
                    placeholder="Pode rasgar seda, o espaço é seu..."
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
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
