/**
 * Camada 7 · Service dos e-mails de modelo (painel admin)
 * Regra: confere `is_admin()` com a sessão (`assertAdmin`) antes de renderizar
 * ou enviar qualquer modelo. O e-mail sai pelo port `AdminEmailPort`.
 * Não faz: acessar o banco (não precisa de dado nenhum, nem de `service_role`)
 * nem montar resposta HTTP.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AdminEmailPort, EmailSendResult } from "@/lib/ports/admin-email"
import { assertAdmin } from "./assert-admin"

export interface AdminEmailsDeps {
  /** Client da sessão de quem chama (nunca o `service_role`). */
  sessionDb: SupabaseClient<Database>
  mailer: AdminEmailPort
}

/**
 * Cria o service de e-mails de modelo do admin.
 *
 * @param deps sessão para o `assertAdmin` e o port de e-mail.
 */
export function createAdminEmailsService(deps: AdminEmailsDeps) {
  return {
    /** HTML do modelo com dados de exemplo (a tela de modelos o mostra num iframe). */
    async previewTemplate(templateKey: string): Promise<string> {
      await assertAdmin(deps.sessionDb)
      return deps.mailer.renderTemplatePreview(templateKey)
    },

    /** Envia o modelo, com dados de exemplo, para um endereço de teste. */
    async sendTest(to: string, templateKey: string): Promise<EmailSendResult> {
      await assertAdmin(deps.sessionDb)
      return deps.mailer.sendTestEmail({ to, templateKey })
    }
  }
}

export type AdminEmailsService = ReturnType<typeof createAdminEmailsService>
