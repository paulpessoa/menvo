"use client"

import { useMutation } from "@tanstack/react-query"
import { ApiClientError, postJson } from "@/lib/query/http"
import {
  evidenceUploadResponseSchema,
  reportCreateResponseSchema,
  type ReportCreateInput,
} from "@/lib/schemas/reports"

async function uploadEvidence(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch("/api/reports/evidence", { method: "POST", body: form })
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : `Erro ${res.status}`
    throw new ApiClientError(res.status, message)
  }
  return evidenceUploadResponseSchema.parse(data).path
}

/**
 * Sends a report, uploading the optional evidence through the server first (the
 * browser never talks to storage). Writes only: no query keys, nothing to invalidate.
 */
export function useSubmitReport() {
  return useMutation({
    mutationFn: async ({ file, ...report }: Omit<ReportCreateInput, "evidence_paths"> & { file?: File | null }) => {
      const evidence_paths = file ? [await uploadEvidence(file)] : []
      return postJson("/api/reports", { ...report, evidence_paths }, reportCreateResponseSchema)
    },
  })
}
