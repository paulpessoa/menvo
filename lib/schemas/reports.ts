import { z } from "zod"

/**
 * Camada 4 · Zod (denuncias)
 * Regra: entrada e saida de `/api/reports` e `/api/reports/evidence`. O formato
 * do body e da resposta e o que o app ja usava; so ganhou limites.
 */

/** Evidence limits, shared by the route, the service and the form. */
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024
export const EVIDENCE_MAX_FILES = 5

/** Allowed evidence types and the extension we store them with (never the client's file name). */
export const EVIDENCE_MIME_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

/** Body of `POST /api/reports`. `reported_email` may be a name; empty means "unknown". */
export const reportCreateSchema = z.object({
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(5000),
  evidence_paths: z.array(z.string().min(1).max(300)).max(EVIDENCE_MAX_FILES).optional().default([]),
  reported_email: z.string().trim().max(320).nullish(),
})
export type ReportCreateInput = z.input<typeof reportCreateSchema>

export const reportCreateResponseSchema = z.object({
  success: z.literal(true),
  reportId: z.string(),
})
export type ReportCreateResponse = z.infer<typeof reportCreateResponseSchema>

/** Response of `POST /api/reports/evidence`: the storage path to send back in `evidence_paths`. */
export const evidenceUploadResponseSchema = z.object({ path: z.string() })
export type EvidenceUploadResponse = z.infer<typeof evidenceUploadResponseSchema>
