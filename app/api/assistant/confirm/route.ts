import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/utils/supabase/server"
import { getFeatureFlags } from "@/lib/feature-flags-server"
import { resolveActor } from "@/lib/services/assistant/actor.service"
import { confirmCapability } from "@/lib/agents/confirm"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  capability: z.string().min(1),
  input: z.record(z.string(), z.unknown())
})

/**
 * Runs a write the assistant proposed, after the user clicked Confirm.
 * Thin on purpose: auth -> Zod -> lib/agents/confirm (which re-checks exposure).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flags = await getFeatureFlags()
  if (!flags.ai_assistant_flag) {
    return NextResponse.json({ error: "Assistant is not enabled" }, { status: 403 })
  }

  const body = bodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const actor = await resolveActor(supabase, user.id)
  const result = await confirmCapability(supabase, actor, body.data.capability, body.data.input)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json({ result: result.output })
}
