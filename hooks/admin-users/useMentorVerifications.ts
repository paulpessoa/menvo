"use client"

import { useQuery } from "@tanstack/react-query"
import { getJson } from "@/lib/query/http"
import { adminUsersKeys } from "@/lib/query/keys/admin-users"
import { adminVerificationsResponseSchema } from "@/lib/schemas/admin-users-responses"

/**
 * Fila de candidaturas de mentor: `pending` (aguardando e com mudanças
 * pedidas) ou `completed` (aprovadas e recusadas). Cada fila é um cache; decidir
 * uma candidatura invalida as duas pelo prefixo `verificationsAll`.
 */
export function useMentorVerifications(queue: "pending" | "completed") {
  return useQuery({
    queryKey: adminUsersKeys.verifications(queue),
    retry: false,
    queryFn: () => getJson(`/api/admin/verifications/${queue}`, adminVerificationsResponseSchema),
    select: (response) => response.verifications,
  })
}
