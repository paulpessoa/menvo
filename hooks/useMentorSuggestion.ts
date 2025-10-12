import { useState } from "react"
import { mentorSuggestionService } from "@/services/mentors/suggestions"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next"

export function useMentorSuggestion() {
  const { t } = useTranslation()
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
  ) => {
    if (!userId) {
      toast({
        title: t("mentorSuggestion.loginRequiredTitle"),
        description: t("mentorSuggestion.loginRequiredDescription"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await mentorSuggestionService.createSuggestion({
        user_id: userId,
        suggestion_text: suggestion.suggestion_text,
        knowledge_topics: suggestion.knowledge_topics || [],
        free_topics: suggestion.free_topics || [],
        inclusion_tags: suggestion.inclusion_tags || [],
      })

      toast({
        title: t("toast.suggestion.success.title"),
        description: t("toast.suggestion.success.description"),
      })

      closeModal()
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error)
      toast({
        title: t("toast.suggestion.error.title"),
        description: t("toast.suggestion.error.description"),
        variant: "destructive",
      })
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
