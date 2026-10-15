import type { Metadata } from "next"
import { createClient } from "@/lib/utils/supabase/server"
import { getCheckin } from "@/lib/services/appointments/checkin-responses.service"
import { checkinOutcomeSchema } from "@/lib/schemas/session-checkin"
import { CheckinClient } from "./CheckinClient"
import { CheckinInvalidCard } from "./CheckinInvalidCard"

export const metadata: Metadata = {
  title: "A mentoria aconteceu? | Menvo",
  robots: { index: false, follow: false }
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ r?: string }>
}

/**
 * Página pública (sem login) do check-in pós-sessão
 * (docs/domains/session-checkin.md). Só LÊ o check-in: a opção clicada no
 * e-mail (`?r=`) chega pré-selecionada e a resposta é gravada no clique de
 * confirmação, porque scanners de e-mail abrem todos os links do e-mail.
 */
export default async function CheckinPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { r } = await searchParams
  const result = await getCheckin(await createClient(), token)

  if (!result.ok) {
    return <CheckinInvalidCard />
  }

  const preselected = checkinOutcomeSchema.safeParse(r)

  return (
    <CheckinClient
      token={token}
      summary={result.data}
      preselected={preselected.success ? preselected.data : null}
    />
  )
}
