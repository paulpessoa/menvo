import { NextResponse } from "next/server"
import { onboardingFlagSchema } from "@/lib/schemas/profile"
import { authenticateRequest, buildOnboardingService } from "@/lib/services/profile/profile.composition"

/**
 * POST/DELETE /api/profile/onboarding - flags dos tours guiados do próprio
 * usuário. Fina: auth, Zod, service, status.
 */
export async function POST(request: Request) {
  try {
    const { user, db } = await authenticateRequest()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = onboardingFlagSchema.safeParse(body)
    if (!parsed.success) {
      const missing = !body?.flag || body?.value === undefined
      return NextResponse.json(
        { error: missing ? "Missing flag or value" : "Invalid flag or value" },
        { status: 400 }
      )
    }

    const outcome = await buildOnboardingService(db).markSeen(user.id, parsed.data)
    if (outcome.kind === "failed") return NextResponse.json({ error: outcome.message }, { status: 500 })

    return NextResponse.json({ success: true, onboarding_flags: outcome.flags })
  } catch (error) {
    console.error("❌ Onboarding flag update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { user, db } = await authenticateRequest()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const outcome = await buildOnboardingService(db).clear(user.id)
    if (outcome.kind === "failed") return NextResponse.json({ error: outcome.message }, { status: 500 })

    return NextResponse.json({ success: true, onboarding_flags: {} })
  } catch (error) {
    console.error("❌ Onboarding flag clear error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
