import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { signCvUrls } from "./cv-storage"

/**
 * Lê as URLs (assinadas) de currículo em lote (uma query, sem N+1) para telas de admin.
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

  // O bucket é privado: devolve URLs assinadas, não o valor guardado.
  return signCvUrls((data ?? []).map((row) => ({ userId: row.user_id, stored: row.cv_url })))
}
