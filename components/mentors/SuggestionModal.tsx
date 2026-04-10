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
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { X, Loader2, Plus } from "lucide-react"

interface SuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (suggestion: {
    suggestion_text: string
    knowledge_topics: string[]
    free_topics: string[]
    inclusion_tags: string[]
  }) => Promise<void>
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

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSuggestionText("")
      setFreeTopics([])
      setInclusionTags([])
      setFreeTopicInput("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleAddFreeTopic = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    
    const trimmedTopic = freeTopicInput.trim()
    if (trimmedTopic && !freeTopics.includes(trimmedTopic)) {
      setFreeTopics(prev => [...prev, trimmedTopic])
      setFreeTopicInput("")
    }
  }

  const handleRemoveFreeTopic = (topic: string) => {
    setFreeTopics(prev => prev.filter(t => t !== topic))
  }

  const handleToggleInclusionTag = (tag: string) => {
    setInclusionTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  const handleSubmitInternal = async () => {
    if (!suggestionText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      console.log('[SUGGESTION_MODAL] Submitting data:', {
        suggestion_text: suggestionText,
        free_topics: freeTopics,
        inclusion_tags: inclusionTags
      })
      
      await onSubmit({
        suggestion_text: suggestionText,
        knowledge_topics: [],
        free_topics: freeTopics,
        inclusion_tags: inclusionTags
      })
      // Success: hook will close modal, which triggers reset via useEffect
    } catch (error) {
      console.error('[SUGGESTION_MODAL] Error in onSubmit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!userId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mentorSuggestion.loginRequiredTitle")}</DialogTitle>
            <DialogDescription>
              {t("mentorSuggestion.loginRequiredDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("mentorSuggestion.title")}</DialogTitle>
          <DialogDescription>
            {t("mentorSuggestion.description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 1. Descrição - Obrigatório */}
          <div className="space-y-2">
            <label htmlFor="suggestion-text" className="text-sm font-semibold flex items-center gap-1">
              {t("mentorSuggestion.observationLabel")} 
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="suggestion-text"
              placeholder={t("mentorSuggestion.observationPlaceholder")}
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {/* 2. Temas ou Áreas - Opcional */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="free-topics" className="text-sm font-semibold">
                {t("mentorSuggestion.freeTopicsLabel")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("mentorSuggestion.freeTopicsDescription")}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                id="free-topics"
                placeholder={t("mentorSuggestion.freeTopicsPlaceholder")}
                value={freeTopicInput}
                onChange={(e) => setFreeTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFreeTopic(e)
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                onClick={() => handleAddFreeTopic()}
                disabled={!freeTopicInput.trim() || isSubmitting}
                size="icon"
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {freeTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {freeTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    {topic}
                    <button
                      onClick={() => handleRemoveFreeTopic(topic)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
                      disabled={isSubmitting}
                      type="button"
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
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold">
                  {t("mentorSuggestion.inclusionTagsLabel")}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t("mentorSuggestion.inclusionTagsDescription")}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {availableInclusionTags.map((tag) => {
                  const isSelected = inclusionTags.includes(tag)
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${isSelected ? 'scale-105' : 'hover:bg-muted'}`}
                      onClick={() => !isSubmitting && handleToggleInclusionTag(tag)}
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isSubmitting}
            type="button"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmitInternal}
            disabled={!suggestionText.trim() || isSubmitting}
            className="min-w-[100px]"
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
