/**
 * Camada 6 · Adapter Supabase (diretório de contatos da org)
 * Regra: implementa `OrgDirectory` com `service_role`: um membro comum só vê a
 * própria linha de `organization_members`, e o e-mail de estranhos em `profiles`
 * é restrito pela RLS. Exceção E3 do ADR 0008. Recebe o client por função
 * (preguiçoso): o build roda sem `SUPABASE_SERVICE_ROLE_KEY`.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { OrgDirectory } from "../org-directory"

export function createSupabaseOrgDirectory(getAdminClient: () => SupabaseClient): OrgDirectory {
  return {
    async listAdminEmails(organizationId) {
      const { data, error } = await getAdminClient()
        .from("organization_members")
        .select("profiles(email)")
        .eq("organization_id", organizationId)
        .eq("role", "admin")
        .eq("status", "active")
      if (error) throw new Error(`org-directory.listAdminEmails: ${error.message}`)

      const emails: string[] = []
      for (const row of (data ?? []) as { profiles: { email: string | null } | { email: string | null }[] | null }[]) {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        if (profile?.email) emails.push(profile.email)
      }
      return emails
    },
  }
}
