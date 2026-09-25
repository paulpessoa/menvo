import type { Metadata } from "next"
import { resolveInviteToken, markOpened } from "@/lib/services/invites/invite-token.service"
import { InviteResponseClient } from "./InviteResponseClient"
import { InviteExpiredCard } from "./InviteExpiredCard"

export const metadata: Metadata = {
  title: "Seu convite Menvo",
  robots: { index: false, follow: false }
}

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * Página pública (sem login) de resposta a um convite de reengajamento.
 * Server Component: resolve o token e registra a primeira abertura
 * (`markOpened`, um timestamp — não é uma ação destrutiva) antes de
 * renderizar. Toda ação que muda algo de verdade (aceitar, virar mentor,
 * parar de receber e-mails, apagar dados) é um POST disparado por clique
 * no client component, nunca por abrir esta página — scanners de e-mail
 * corporativo abrem links automaticamente (ver
 * docs/domains/reengagement-invites.md §3.2).
 */
export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const resolved = await resolveInviteToken(token)

  if (!resolved.ok) {
    return <InviteExpiredCard reason={resolved.reason} />
  }

  await markOpened(resolved.invite.id)

  const firstName = resolved.profile.full_name?.split(" ")[0] || resolved.profile.email.split("@")[0]

  return (
    <InviteResponseClient
      token={token}
      firstName={firstName}
      alreadyResponded={resolved.invite.response}
    />
  )
}
