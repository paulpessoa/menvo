import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { requireAdmin } from "@/lib/auth/require-admin"
import { sendWaitingListAccountInvite } from "@/lib/email/brevo"

/**
 * Provisiona (ou reaproveita) uma conta Menvo para uma pessoa da lista de
 * espera e envia um convite com link de autenticação. Ao ser criada, a
 * conta já vira "mentee" por padrão via trigger do banco em auth.users —
 * ninguém aqui atribui role manualmente.
 *
 * A "invite" do Supabase (`generateLink({ type: 'invite' })`) só funciona
 * para e-mails que ainda não têm conta — e, ao contrário do que parece,
 * NÃO deve vir depois de um `admin.createUser()` manual: confirmado na
 * prática, chamar `generateLink({type:'invite'})` para um e-mail que
 * acabou de ser criado com `createUser({email_confirm:true})` retorna
 * "A user with this email address has already been registered", porque
 * do ponto de vista do Supabase esse e-mail deixou de estar "pendente de
 * convite" no instante em que foi confirmado. O jeito certo é deixar o
 * próprio `generateLink({type:'invite'})` criar o usuário (ele aceita
 * `options.data` com os mesmos metadados que um `user_metadata` normal
 * teria) — um único passo, sem `createUser` antes. Para quem já tem conta
 * (has_profile), usamos "recovery" no lugar, que serve ao mesmo propósito
 * para uma conta já existente. Em ambos os casos, geramos o link sem
 * deixar o Supabase disparar o e-mail padrão dele — o link vai embutido
 * no nosso próprio template do Brevo.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { waitingListId } = await request.json()
    if (!waitingListId) {
      return NextResponse.json({ error: "waitingListId é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: entry, error: entryError } = await supabase
      .from("waiting_list")
      .select("name, email, whatsapp, reason")
      .eq("id", waitingListId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: "Registro não encontrado na lista de espera" }, { status: 404 })
    }

    const { name, email, whatsapp, reason } = entry as any
    const serviceClient = createServiceRoleClient()

    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    const accountCreated = !existingProfile
    // Points straight at /update-password rather than /auth/callback.
    // Confirmed empirically (curl against the real Supabase verify
    // endpoint): the session and the `type` this link carries arrive as a
    // URL HASH FRAGMENT (`#access_token=...&type=invite`), which browsers
    // never send to the server — so /auth/callback's server-side
    // `searchParams.get("type")` check can never see it for links
    // generated this way, regardless of what type is requested. Rather
    // than build fragment-parsing logic into a redirect hop,
    // /update-password already does the right thing on its own: it waits
    // for the client-side Supabase library to pick up the hash (which
    // happens automatically) and renders the "set a password" form once a
    // session exists. Verified end-to-end in a live session: an invite
    // link's redirect landed on this page, the form correctly showed
    // (not the "expired link" state), and after saving, signing in with
    // the new password worked immediately.
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
      return NextResponse.json(
        { error: linkError?.message || "Falha ao gerar o link de convite" },
        { status: 500 }
      )
    }

    if (accountCreated && linkData.user?.id && (whatsapp || reason)) {
      // Preenche o que já sabemos a partir do formulário da lista de
      // espera, para poupar retrabalho depois do primeiro login. O
      // trigger que cria a linha em `profiles` já rodou nesse ponto (é
      // parte da mesma inserção em auth.users feita pelo generateLink),
      // então isso é um UPDATE.
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
      return NextResponse.json({ error: emailResult.error || "Falha ao enviar e-mail" }, { status: 502 })
    }

    await supabase
      .from("waiting_list")
      .update({ status: "invited" })
      .eq("id", waitingListId)

    return NextResponse.json({ success: true, accountCreated })
  } catch (error: any) {
    console.error("[API waiting-list/create-account] Erro:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
