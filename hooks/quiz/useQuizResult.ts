"use client"

import { useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query/keys"
import { getJson, postJson } from "@/lib/query/http"
import { quizAnalyzeResponseSchema, quizResultViewSchema } from "@/lib/schemas/quiz"

const POLL_MS = 2000
/** ~4 min sem resultado: para de girar e vira erro (ex.: orçamento de IA do mês esgotado). */
const MAX_POLLS = 120
/** A cada ~70s pede a análise de novo: cobre requisição que morreu no meio ou aba fechada logo após enviar. */
const REANALYZE_EVERY = 35

/**
 * The public result of a quiz, polled until the analysis is ready
 * (`processed_at` set). The re-request is safe: the server claims the row
 * atomically, so a duplicate does nothing. Fails (`isError`) on not-found,
 * server errors or after ~4 minutes without a result.
 */
export function useQuizResult(id: string | undefined) {
  const polls = useRef({ id, count: 0 })
  if (polls.current.id !== id) polls.current = { id, count: 0 }

  return useQuery({
    queryKey: qk.quiz.result(id ?? ""),
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      const result = await getJson(`/api/quiz/${id}`, quizResultViewSchema)
      if (result.processed_at) return result

      const attempt = polls.current.count++
      if (attempt >= MAX_POLLS) throw new Error("Quiz analysis timed out")
      if (attempt > 0 && attempt % REANALYZE_EVERY === 0) {
        // Best effort: a failure here must not break the polling.
        void postJson(`/api/quiz/${id}/analyze`, undefined, quizAnalyzeResponseSchema).catch(() => {})
      }
      return result
    },
    refetchInterval: (query) =>
      query.state.status === "error" || query.state.data?.processed_at || !query.state.data ? false : POLL_MS,
  })
}
