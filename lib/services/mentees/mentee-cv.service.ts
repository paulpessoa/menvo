import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { cvLink } from "./cv-storage"

/**
 * Monta os links de currículo em lote (uma query, sem N+1) para telas de admin.
 *
 * `mentee_profiles.cv_url` não tem grant de leitura para `authenticated`
 * (o currículo só pode ser visto pelo próprio, admin ou quem divide mentoria),
 * então o cliente de sessão do admin não consegue selecionar a coluna. Por isso
 * usa service role: o chamador PRECISA estar protegido por `requireAdmin()`.
 */
export async function fetchCvUrls(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()

  const { data, error } = await createServiceRoleClient()
    .from("mentee_profiles")
    .select("user_id, cv_url")
    .in("user_id", userIds)
    .not("cv_url", "is", null)

  if (error) throw new Error(error.message)

  // Devolve o link do Menvo (/api/cv/<id>), nunca o caminho no bucket.
  const links = new Map<string, string>()
  for (const row of data ?? []) {
    const link = cvLink(row.user_id, row.cv_url)
    if (link) links.set(row.user_id, link)
  }
  return links
}
