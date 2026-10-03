/**
 * Camada 6 · Adapter Supabase (criação de conta sem sessão)
 * Regra: implementa `AccountProvisioner` com `auth.admin.createUser`. Recebe o
 * client por função (preguiçoso): o build roda sem `SUPABASE_SERVICE_ROLE_KEY`.
 * Exceção de `service_role` documentada no ADR 0007.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AccountProvisioner } from "../account-provisioner"

export function createSupabaseAccountProvisioner(getAdminClient: () => SupabaseClient): AccountProvisioner {
  return {
    async emailHasAccount(email) {
      const { data } = await getAdminClient().from("profiles").select("id").eq("email", email).limit(1)
      return Boolean(data && data.length > 0)
    },

    async createConfirmedAccount({ email, password, fullName }) {
      const [firstName, ...rest] = fullName.trim().split(/\s+/)
      const { data, error } = await getAdminClient().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || "",
          last_name: rest.join(" "),
          full_name: fullName.trim(),
        },
      })

      if (error || !data?.user) {
        // Cadastrada por outro caminho no meio tempo (ou linha de perfil faltando).
        if (error?.status === 422 || /already/i.test(error?.message || "")) return { kind: "exists" }
        // Senha recusada pela política de autenticação do projeto.
        if (error?.status === 400) return { kind: "password_rejected", message: error.message }
        return { kind: "failed", message: error?.message }
      }

      return { kind: "created", userId: data.user.id }
    },
  }
}
