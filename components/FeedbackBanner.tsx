"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, MessageSquare } from 'lucide-react'
import { useToast } from "@/hooks/useToast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

export function FeedbackBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    if (user?.email) {
      setContactEmail(user.email)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback vazio",
        description: "Por favor, escreva seu feedback antes de enviar.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log("Feedback submitted:", { feedbackText, contactEmail })

      toast({
        title: "Feedback enviado!",
        description: "Agradecemos sua contribuição para melhorar a plataforma.",
        variant: "default",
      })
      setFeedbackText("")
      setContactEmail("")
      setIsModalOpen(false)
      setIsVisible(false) // Hide banner after submission
    } catch (error) {
      toast({
        title: "Erro ao enviar feedback",
        description: "Não foi possível enviar seu feedback. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Tem um feedback?</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleOpenModal}>
              Enviar
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar banner</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar Feedback</DialogTitle>
            <DialogDescription>
              Ajude-nos a melhorar a plataforma. Seu feedback é muito importante!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="feedback">Seu Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="O que você achou? O que podemos melhorar?"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Seu E-mail (Opcional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Usaremos seu e-mail apenas para entrar em contato sobre seu feedback, se necessário.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
