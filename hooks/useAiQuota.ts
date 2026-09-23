import { useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useAuth } from "@/lib/auth"
import type { AiFeature } from "@/lib/ai/features"
import type { AiQuotaStatus } from "@/lib/ai/quota"

export const aiQuotaSchema = z.object({
  allowed: z.boolean(),
  used: z.number(),
  limit: z.number().nullable(),
  remaining: z.number().nullable(),
  resetsAt: z.string(),
  reason: z.enum(["ok", "quota", "budget"])
})

async function fetchQuota(feature: AiFeature): Promise<AiQuotaStatus> {
  const res = await fetch(`/api/ai/quota?feature=${feature}`)
  if (!res.ok) throw new Error("Failed to fetch AI quota")
  return z.object({ quota: aiQuotaSchema }).parse(await res.json()).quota
}

/**
 * Monthly AI credits for the logged-in user. `setQuota` lets the caller push
 * the fresh status returned by an AI endpoint, so the counter updates without
 * a second request.
 */
export function useAiQuota(feature: AiFeature) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ["ai-quota", feature, user?.id]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchQuota(feature),
    enabled: !loading && !!user,
    staleTime: 60_000
  })

  const setQuota = (quota: unknown) => {
    const parsed = aiQuotaSchema.safeParse(quota)
    if (parsed.success) queryClient.setQueryData(queryKey, parsed.data)
  }

  return { quota: query.data, setQuota }
}
