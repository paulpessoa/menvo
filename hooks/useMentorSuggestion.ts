import { useState } from "react"
import { mentorSuggestionService } from "@/services/mentors/suggestions"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

export function useMentorSuggestion() {
  const t = useTranslations()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleSubmit = async (
    userId: string,
    suggestion: {
      suggestion_text: string
      knowledge_topics: string[]
      free_topics: string[]
      inclusion_tags: string[]
    }
  ): Promise<void> => {
    console.log('[SUGGESTION_DEBUG] Submitting:', { userId, suggestion })
    
    if (!userId) {
      toast({
        title: t("mentorSuggestion.loginRequiredTitle"),
        description: t("mentorSuggestion.loginRequiredDescription"),
        variant: "destructive",
      })
      return Promise.reject('No user ID')
    }

    setIsSubmitting(true)
    try {
      const result = await mentorSuggestionService.createSuggestion({
        user_id: userId,
        suggestion_text: suggestion.suggestion_text,
        knowledge_topics: suggestion.knowledge_topics || [],
        free_topics: suggestion.free_topics || [],
        inclusion_tags: suggestion.inclusion_tags || [],
      })

      console.log('[SUGGESTION_DEBUG] Success:', result)

      toast({
        title: t("toast.suggestion.success.title"),
        description: t("toast.suggestion.success.description"),
      })

      closeModal()
      return Promise.resolve()
    } catch (error: any) {
      console.error("[SUGGESTION_DEBUG] Error:", error)
      toast({
        title: t("toast.suggestion.error.title"),
        description: error.message || t("toast.suggestion.error.description"),
        variant: "destructive",
      })
      return Promise.reject(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isModalOpen,
    isSubmitting,
    openModal,
    closeModal,
    handleSubmit,
  }
}
