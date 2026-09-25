import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { sendWaitingListAccountInvite } from "@/lib/email/brevo"
import { createClient } from "@/lib/utils/supabase/server"

export interface WaitingListEntryInput {
  id: string
  name: string
  email: string
  whatsapp: string | null
  reason: string | null
}

export interface CreateAccountResult {
  success: boolean
  accountCreated: boolean
  error?: string
  /** Em qual etapa falhou — usado pelo endpoint em lote para decidir se
   *  interrompe o processamento (ex: e-mail estourou o limite diário do
   *  Brevo, não adianta continuar tentando os próximos) ou só pula esse
   *  registro e segue (ex: e-mail inválido, link não gerou). */
  failedStage?: "link" | "email"
}

/**
 * Provisiona (ou reaproveita) uma conta Menvo para uma pessoa da lista de
 * espera e envia um convite com link de autenticação. Extraído do endpoint
 * create-account original para ser reaproveitado tanto na criação individual
 * quanto na criação em lote — ver o comentário longo original em
 * app/api/admin/waiting-list/create-account/route.ts sobre por que
 * `generateLink({type:'invite'})` é chamado sozinho, sem `admin.createUser()`
 * antes.
 */
export async function createAccountForWaitingListEntry(
  entry: WaitingListEntryInput
): Promise<CreateAccountResult> {
  const { id: waitingListId, name, email, whatsapp, reason } = entry
  const serviceClient = createServiceRoleClient()

  const { data: existingProfile } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  const accountCreated = !existingProfile
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.menvo.com.br"}/update-password`

  const nameParts = String(name || "").trim().split(/\s+/)
  const firstName = nameParts[0] || "Usuário"
  const lastName = nameParts.slice(1).join(" ") || ""

  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink(
    accountCreated
      ? {
          type: "invite",
          email,
          options: {
            redirectTo,
            data: { first_name: firstName, last_name: lastName, full_name: name }
          }
        }
      : { type: "recovery", email, options: { redirectTo } }
  )

  if (linkError || !linkData?.properties?.action_link) {
    return {
      success: false,
      accountCreated,
      error: linkError?.message || "Falha ao gerar o link de convite",
      failedStage: "link"
    }
  }

  if (accountCreated && linkData.user?.id && (whatsapp || reason)) {
    const profileUpdates: Record<string, any> = {}
    if (whatsapp) profileUpdates.phone = whatsapp
    if (reason) profileUpdates.bio = reason

    await serviceClient
      .from("profiles")
      .update(profileUpdates)
      .eq("id", linkData.user.id)
  }

  const emailResult = await sendWaitingListAccountInvite({
    name,
    email,
    inviteLink: linkData.properties.action_link
  })

  if (!emailResult.success) {
    return {
      success: false,
      accountCreated,
      error: emailResult.error || "Falha ao enviar e-mail",
      failedStage: "email"
    }
  }

  const supabase = await createClient()
  await supabase
    .from("waiting_list")
    .update({ status: "invited" })
    .eq("id", waitingListId)

  return { success: true, accountCreated }
}
