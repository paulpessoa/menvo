"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"

interface SuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (suggestion: {
    suggestion_text: string
    knowledge_topics: string[]
    free_topics: string[]
    inclusion_tags: string[]
  }) => void
  userId: string | null
  availableInclusionTags?: string[]
}

export function SuggestionModal({
  isOpen,
  onClose,
  onSubmit,
  userId,
  availableInclusionTags = [],
}: SuggestionModalProps) {
  const t = useTranslations()
  const [suggestionText, setSuggestionText] = useState("")
  const [freeTopics, setFreeTopics] = useState<string[]>([])
  const [inclusionTags, setInclusionTags] = useState<string[]>([])
  const [freeTopicInput, setFreeTopicInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddFreeTopic = () => {
    const trimmedTopic = freeTopicInput.trim()
    if (trimmedTopic && !freeTopics.includes(trimmedTopic)) {
      setFreeTopics([...freeTopics, trimmedTopic])
      setFreeTopicInput("")
    }
  }

  const handleRemoveFreeTopic = (topic: string) => {
    setFreeTopics(freeTopics.filter(t => t !== topic))
  }

  const handleToggleInclusionTag = (tag: string) => {
    if (inclusionTags.includes(tag)) {
      setInclusionTags(inclusionTags.filter(t => t !== tag))
    } else {
      setInclusionTags([...inclusionTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!suggestionText.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        suggestion_text: suggestionText,
        knowledge_topics: [], // Legado
        free_topics: freeTopics,
        inclusion_tags: inclusionTags
      })
      // O fechamento e reset são tratados pelo onClose do Dialog se o onSubmit fechar o modal
    } catch (error) {
      console.error('Erro no envio:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setSuggestionText("")
    setFreeTopics([])
    setInclusionTags([])
    setFreeTopicInput("")
    onClose()
  }

  if (!userId) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mentorSuggestion.loginRequiredTitle")}</DialogTitle>
            <DialogDescription>
              {t("mentorSuggestion.loginRequiredDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("mentorSuggestion.title")}</DialogTitle>
          <DialogDescription>
            {t("mentorSuggestion.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {/* 1. Descrição - Obrigatório */}
          <div>
            <label htmlFor="suggestion-text" className="text-sm font-medium block mb-2">
              {t("mentorSuggestion.observationLabel")} <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="suggestion-text"
              placeholder={t("mentorSuggestion.observationPlaceholder")}
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* 2. Temas ou Áreas - Opcional */}
          <div>
            <label htmlFor="free-topics" className="text-sm font-medium block mb-1">
              {t("mentorSuggestion.freeTopicsLabel")}
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              {t("mentorSuggestion.freeTopicsDescription")}
            </p>
            <div className="flex gap-2">
              <Input
                id="free-topics"
                placeholder={t("mentorSuggestion.freeTopicsPlaceholder")}
                value={freeTopicInput}
                onChange={(e) => setFreeTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFreeTopic()
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                onClick={handleAddFreeTopic}
                disabled={!freeTopicInput.trim() || isSubmitting}
                size="sm"
              >
                {t("mentorSuggestion.addTopic")}
              </Button>
            </div>
            {freeTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {freeTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="gap-1">
                    {topic}
                    <button
                      onClick={() => handleRemoveFreeTopic(topic)}
                      className="ml-1 hover:text-destructive"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 3. Tags Inclusivas - Opcional */}
          {availableInclusionTags.length > 0 && (
            <div>
              <label className="text-sm font-medium block mb-1">
                {t("mentorSuggestion.inclusionTagsLabel")}
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("mentorSuggestion.inclusionTagsDescription")}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableInclusionTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={inclusionTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => !isSubmitting && handleToggleInclusionTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!suggestionText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.submitting")}
              </>
            ) : t("common.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
