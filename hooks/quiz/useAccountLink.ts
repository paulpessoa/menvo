"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { effects, runEffects } from "@/lib/query/effects"
import { qk } from "@/lib/query/keys"
import { ApiClientError, getJson, postJson } from "@/lib/query/http"
import { quizAccountCreatedSchema, quizAccountStatusSchema } from "@/lib/schemas/quiz"

/**
 * Can the `?k=` link from the results e-mail still create an account?
 * `null` = invalid or expired link (the banner stays hidden). The token is the
 * credential, so it is passed to the request but kept out of the query key.
 */
export function useAccountLink(quizId: string, token: string) {
  return useQuery({
    queryKey: qk.quiz.accountLink(quizId),
    retry: false,
    queryFn: async () => {
      try {
        return await getJson(`/api/quiz/${quizId}/account?k=${encodeURIComponent(token)}`, quizAccountStatusSchema)
      } catch (error) {
        if (error instanceof ApiClientError) return null
        throw error
      }
    },
  })
}

/**
 * Creates the confirmed account from the quiz. A 409 means that e-mail already
 * has an account: `isExistingAccount(error)` tells the banner to point to login.
 */
export function useCreateQuizAccount(quizId: string, token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (password: string) =>
      postJson(`/api/quiz/${quizId}/account`, { token, password }, quizAccountCreatedSchema),
    onSuccess: () => runEffects(qc, effects["quiz.account.create"]({ quizId })),
  })
}

export const isExistingAccount = (error: unknown) => error instanceof ApiClientError && error.body?.status === "exists"
