/**
 * Camada 5 · Repository (denuncias)
 * Regra: unico ponto que fala com `user_reports`. Recebe o client DA SESSAO: a
 * policy "Users can insert their own reports" exige reporter_id = auth.uid().
 * Não faz: validar caminho de evidencia (camada 7).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { RepositoryError } from "./repository-error"

export interface NewReport {
  reporterId: string
  category: string
  description: string
  evidencePaths: string[]
  reportedEmail: string | null
}

export interface ReportsRepository {
  /** Inserts a pending report and returns its id. */
  insert(report: NewReport): Promise<string>
}

export function createReportsRepository(db: SupabaseClient<Database>): ReportsRepository {
  return {
    async insert(report) {
      const { data, error } = await db
        .from("user_reports")
        .insert({
          reporter_id: report.reporterId,
          category: report.category,
          description: report.description,
          evidence_paths: report.evidencePaths,
          reported_email: report.reportedEmail,
          status: "pending",
        })
        .select("id")
        .single()
      if (error || !data) throw new RepositoryError("reports.insert", error)
      return data.id
    },
  }
}
