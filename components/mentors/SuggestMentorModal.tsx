"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mentorSuggestionSchema, MentorSuggestionInput } from "@/lib/schemas/suggestions"
import { toast } from "sonner"
import { Loader2, Lightbulb } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth"
import { Label } from "@/components/ui/label"

interface SuggestMentorModalProps {
  isOpen: boolean
  onClose: () => void
  initialTopic?: string
}

export function SuggestMentorModal({ isOpen, onClose, initialTopic = "" }: SuggestMentorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<MentorSuggestionInput>({
    resolver: zodResolver(mentorSuggestionSchema),
    defaultValues: {
      topic: initialTopic,
      description: "",
      email: user?.email || "",
    },
  })

  // Reset form when opened with new topic
  useState(() => {
    if (isOpen) {
      setValue("topic", initialTopic)
    }
  })

  async function onSubmit(data: MentorSuggestionInput) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erro ao enviar sugestão")
      }

      toast.success("Obrigado pela sugestão! Vamos avaliar e tentar trazer um mentor com esse perfil.")
      reset()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Ocorreu um erro ao enviar sua sugestão. Tente novamente mais tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Sugerir um Tema ou Mentor
          </DialogTitle>
          <DialogDescription>
            Não encontrou o que estava buscando? Diga o que você precisa e tentaremos adicionar na plataforma!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">O que você estava buscando?</Label>
            <Input 
              id="topic"
              placeholder="Ex: Produto, Carreira em TI, Design de Serviços..." 
              {...register("topic")} 
            />
            {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mais detalhes (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Me conte mais sobre o perfil que você procura..."
              className="resize-none h-24"
              {...register("description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="email">Seu e-mail (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Deixe seu e-mail para avisarmos"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Sugestão"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
