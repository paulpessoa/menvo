import { type NextRequest, NextResponse } from "next/server"
import { updateProfileSchema } from "@/lib/schemas/profile"
import { authenticateRequest, buildProfileService } from "@/lib/services/profile/profile.composition"

/**
 * GET/PUT /api/profile - perfil do próprio usuário. Fina de propósito: auth,
 * Zod, service, status. A lista de colunas e a ordem das escritas moram no
 * repository e no service (lib/repositories/profile.repository.ts).
 */
const unauthorized = (details?: string) =>
  NextResponse.json({ error: "Token ou sessão de autorização necessária", details }, { status: 401 })

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) return unauthorized(authError?.message)

    const parsed = updateProfileSchema.safeParse(await request.json())
    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Dados de perfil inválidos"
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const outcome = await buildProfileService().updateOwn(user.id, parsed.data)

    if (outcome.kind === "slug_taken") {
      return NextResponse.json({ error: "Esse endereço de perfil (slug) já está em uso" }, { status: 409 })
    }
    if (outcome.kind === "failed") {
      return NextResponse.json({ error: "Erro ao atualizar perfil", details: outcome.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Perfil atualizado com sucesso", profile: outcome.profile })
  } catch (error) {
    console.error("❌ Unexpected profile update error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) return unauthorized(authError?.message)

    const outcome = await buildProfileService().getOwn(user)

    if (outcome.kind === "failed") {
      const error = outcome.stage === "create" ? "Erro ao criar perfil" : "Erro ao buscar perfil"
      return NextResponse.json({ error, details: outcome.message }, { status: 500 })
    }

    return NextResponse.json({ profile: outcome.profile })
  } catch (error) {
    console.error("❌ Unexpected profile fetch error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
