import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { resolveAudience } from "@/lib/services/invites/audience.service"

const bodySchema = z.object({
  audience: z.enum(["selected", "jotform_not_invited", "never_signed_in", "all"]),
  campaign: z.string().trim().min(1).max(100),
  userIds: z.array(z.string().uuid()).max(5000).optional(),
  resend: z.boolean().optional()
})

/**
 * Counts who a reengagement campaign would actually reach for a given
 * audience — before anything is sent. The admin modal calls this on
 * every audience/resend change so the confirmation step always shows a
 * true number, never a guess.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { eligible, skipped } = await resolveAudience(parsed.data)

    // Returns the actual id list (not just a count): the admin modal
    // drives the send loop client-side in batches of 25
    // (POST /api/admin/invites/send), so it needs these ids to batch —
    // there's no "send this whole audience" endpoint that resolves the
    // list twice.
    return NextResponse.json({
      eligibleUserIds: eligible.map(p => p.id),
      skipped
    })
  } catch (error) {
    console.error("[API INVITES AUDIENCE] Erro:", error)
    const message = error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
