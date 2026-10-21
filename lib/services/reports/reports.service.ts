/**
 * Camada 7 · Service (denuncias)
 * Regra: o usuario so anexa arquivo da propria pasta, e o caminho do arquivo e
 * sempre gerado aqui (nunca derivado do nome enviado pelo cliente).
 * Não faz: HTTP (camada 8) nem SQL (camada 5).
 */
import { randomUUID } from "node:crypto"
import type { ReportsRepository } from "@/lib/repositories/reports.repository"
import type { ReportEvidenceStorage } from "@/lib/ports/reports-evidence-storage"
import { EVIDENCE_MAX_BYTES, EVIDENCE_MIME_EXTENSIONS, type reportCreateSchema } from "@/lib/schemas/reports"
import type { z } from "zod"

export type ReportsErrorCode = "invalid_evidence_path" | "unsupported_type" | "too_large" | "empty_file"

/** Business-rule failure the route maps to a 4xx. */
export class ReportsError extends Error {
  constructor(public readonly code: ReportsErrorCode, message: string) {
    super(message)
    this.name = "ReportsError"
  }
}

/** True when `path` sits directly under the user's own folder and cannot climb out of it. */
export function isOwnEvidencePath(userId: string, path: string): boolean {
  if (!path.startsWith(`${userId}/`)) return false
  const rest = path.slice(userId.length + 1)
  return rest.length > 0 && !rest.includes("/") && !rest.includes("..") && !rest.includes("\\")
}

/** Creates a pending report; rejects evidence that is not in the reporter's own folder. */
export async function createReport(
  repo: ReportsRepository,
  userId: string,
  input: z.output<typeof reportCreateSchema>
): Promise<string> {
  if (!input.evidence_paths.every((p) => isOwnEvidencePath(userId, p))) {
    throw new ReportsError("invalid_evidence_path", "Anexo inválido.")
  }
  return repo.insert({
    reporterId: userId,
    category: input.category,
    description: input.description,
    evidencePaths: input.evidence_paths,
    reportedEmail: input.reported_email || null,
  })
}

/** Validates type and size, stores the file under `<userId>/` and returns the path. */
export async function uploadEvidence(
  storage: ReportEvidenceStorage,
  userId: string,
  file: { type: string; size: number; bytes: () => Promise<Uint8Array> }
): Promise<string> {
  const ext = EVIDENCE_MIME_EXTENSIONS[file.type]
  if (!ext) throw new ReportsError("unsupported_type", "Tipo de arquivo não permitido (use imagem ou PDF).")
  if (file.size === 0) throw new ReportsError("empty_file", "Arquivo vazio.")
  if (file.size > EVIDENCE_MAX_BYTES) throw new ReportsError("too_large", "Arquivo muito grande (máximo 5MB).")

  const path = `${userId}/${Date.now()}_${randomUUID()}.${ext}`
  await storage.upload(path, await file.bytes(), file.type)
  return path
}
