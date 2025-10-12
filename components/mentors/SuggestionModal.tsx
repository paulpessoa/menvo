
"use client"

import { useState, useEffect } from "react"
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
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { mentorService } from "@/services/mentors/mentors"

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
}

export function SuggestionModal({
  isOpen,
  onClose,
  onSubmit,
  userId,
}: SuggestionModalProps) {
  const { t } = useTranslation()
  const [suggestionText, setSuggestionText] = useState("")
  const [freeTopics, setFreeTopics] = useState<string[]>([])
  const [inclusionTags, setInclusionTags] = useState<string[]>([])
  const [freeTopicInput, setFreeTopicInput] = useState("")
  const [availableInclusionTags, setAvailableInclusionTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadFilterOptions()
    }
  }, [isOpen])

  const loadFilterOptions = async () => {
    try {
      const options = await mentorService.getFilterOptions()
      setAvailableInclusionTags(options.inclusionTags)
    } catch (error) {
      console.error('Erro ao carregar opções:', error)
    }
  }

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

  const handleSubmit = () => {
    if (!suggestionText.trim()) return

    setIsLoading(true)
    onSubmit({
      suggestion_text: suggestionText,
      knowledge_topics: [], // Não usado mais
      free_topics: freeTopics,
      inclusion_tags: inclusionTags
    })
  }

  const handleClose = () => {
    setSuggestionText("")
    setFreeTopics([])
    setInclusionTags([])
    setFreeTopicInput("")
    setIsLoading(false)
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddFreeTopic}
                disabled={!freeTopicInput.trim() || isLoading}
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
                      disabled={isLoading}
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
                    onClick={() => !isLoading && handleToggleInclusionTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!suggestionText.trim() || isLoading}
          >
            {isLoading ? t("common.submitting") : t("common.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
