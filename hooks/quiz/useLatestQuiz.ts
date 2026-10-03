"use client"

import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query/keys"
import { getJson } from "@/lib/query/http"
import { quizLatestResponseSchema } from "@/lib/schemas/quiz"

/**
 * The logged-in person's most recent quiz (dashboard "did the diagnostic?").
 * The server derives the e-mail from the session; only the user id is part of
 * the key, so a different account never sees another account's cache.
 * A failure resolves to `null` (as the old wrapper did): the dashboard then
 * offers the quiz instead of an error.
 */
export function useLatestQuiz(userId: string | undefined) {
  return useQuery({
    queryKey: qk.quiz.latest(userId ?? ""),
    enabled: !!userId,
    retry: false,
    queryFn: async () => {
      try {
        return (await getJson("/api/quiz/latest", quizLatestResponseSchema)).summary
      } catch (error) {
        console.error("[useLatestQuiz]", error)
        return null
      }
    },
  })
}
