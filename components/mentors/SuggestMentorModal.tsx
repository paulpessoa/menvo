"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, Lightbulb, Loader2 } from "lucide-react"

import {
  mentorSuggestionSchema,
  type MentorSuggestionInput,
  type SuggestionContext,
} from "@/lib/schemas/suggestions"
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
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { SuggestionContextSummary } from "@/components/mentors/SuggestionContextSummary"

const DESCRIPTION_MAX = 500
const SUCCESS_CLOSE_DELAY_MS = 1800

interface SuggestMentorModalProps {
  isOpen: boolean
  onClose: () => void
  initialTopic?: string
  context?: SuggestionContext | null
}

/**
 * Captures demand the catalog can't serve yet. Opened from the empty state of
 * /mentors, so it arrives pre-filled with the search term and active filters —
 * the less the person has to retype, the more likely they finish.
 */
export function SuggestMentorModal({ isOpen, onClose, initialTopic = "", context }: SuggestMentorModalProps) {
  const t = useTranslations("mentorsPage.suggestModal")
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { register, handleSubmit, reset, setFocus, watch, formState: { errors } } = useForm<MentorSuggestionInput>({
    resolver: zodResolver(mentorSuggestionSchema),
  })
  const descriptionLength = watch("description")?.length ?? 0

  // The modal stays mounted between openings, so re-seed it every time it opens.
  useEffect(() => {
    if (!isOpen) return
    setIsSubmitted(false)
    reset({ topic: initialTopic, description: "", email: user?.email ?? "" })
  }, [isOpen, initialTopic, user?.email, reset])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  function handleOpenChange(open: boolean) {
    if (open || isSubmitting) return
    clearTimeout(closeTimerRef.current)
    onClose()
  }

  async function onSubmit(data: MentorSuggestionInput) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, context: context ?? null }),
      })
      if (!response.ok) throw new Error(`Suggestion request failed: ${response.status}`)

      setIsSubmitted(true)
      closeTimerRef.current = setTimeout(onClose, SUCCESS_CLOSE_DELAY_MS)
    } catch (error) {
      console.error(error)
      toast.error(t("error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[460px] rounded-2xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          setFocus(initialTopic ? "description" : "topic")
        }}
      >
        {isSubmitted ? (
          <div role="status" className="flex flex-col items-center text-center py-8 gap-3 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold">{t("successTitle")}</DialogTitle>
            <DialogDescription className="max-w-xs">{t("successDescription")}</DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                {t("title")}
              </DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <SuggestionContextSummary context={context} />

              <div className="space-y-2">
                <Label htmlFor="suggestion-topic">{t("topicLabel")}</Label>
                <Input
                  id="suggestion-topic"
                  maxLength={100}
                  placeholder={t("topicPlaceholder")}
                  aria-invalid={Boolean(errors.topic)}
                  {...register("topic")}
                />
                {errors.topic && <p className="text-sm text-destructive">{t("errors.topic")}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="suggestion-description">{t("descriptionLabel")}</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {descriptionLength}/{DESCRIPTION_MAX}
                  </span>
                </div>
                <Textarea
                  id="suggestion-description"
                  maxLength={DESCRIPTION_MAX}
                  placeholder={t("descriptionPlaceholder")}
                  className="resize-none h-24"
                  {...register("description")}
                />
                {errors.description && <p className="text-sm text-destructive">{t("errors.description")}</p>}
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="suggestion-email">{t("emailLabel")}</Label>
                  <Input
                    id="suggestion-email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    aria-invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-sm text-destructive">{t("errors.email")}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? t("submitting") : t("submit")}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
