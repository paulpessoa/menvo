/**
 * Camada 6 · Adapter Supabase Storage (evidencias de denuncia)
 * Regra: implementa `ReportEvidenceStorage` no bucket privado `reports_evidence`
 * com o client da sessao (policy: so a pasta do proprio usuario). Nunca service_role.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { ReportEvidenceStorage } from "../reports-evidence-storage"

export const REPORTS_EVIDENCE_BUCKET = "reports_evidence"

export function createSupabaseReportEvidenceStorage(db: SupabaseClient<Database>): ReportEvidenceStorage {
  return {
    async upload(path, bytes, contentType) {
      const { error } = await db.storage.from(REPORTS_EVIDENCE_BUCKET).upload(path, bytes, { contentType, upsert: false })
      if (error) throw new Error(`reports.evidence.upload: ${error.message}`)
    },
  }
}
