"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clearQuizDraft } from "@/lib/quiz/draft"
import { effects } from "@/lib/query/effects"
import { runEffects } from "@/lib/query/effects"
import { postJson } from "@/lib/query/http"
import { quizSubmitResponseSchema, type QuizSubmitInput } from "@/lib/schemas/quiz"

/**
 * Sends the quiz. On success the draft is cleared (it is no longer a draft)
 * and everything that depends on a new quiz is invalidated via the effects map.
 * Errors are `ApiClientError`: `code` is `email_limit` | `ip_limit` | `budget`
 * when the server refused for a limit.
 */
export function useSubmitQuiz() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: QuizSubmitInput) => postJson("/api/quiz", input, quizSubmitResponseSchema),
    onSuccess: () => {
      clearQuizDraft()
      return runEffects(qc, effects["quiz.submit"]())
    },
  })
}
