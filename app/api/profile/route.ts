import { NextResponse } from "next/server"
import { updateProfileSchema } from "@/lib/schemas/profile"
import { authenticateRequest, buildProfileService } from "@/lib/services/profile/profile.composition"

/**
 * GET/PUT /api/profile - perfil do próprio usuário. Fina de propósito: auth,
 * Zod, service, status. A lista de colunas e a ordem das escritas moram no
 * repository e no service (lib/repositories/profile.repository.ts).
 */
const unauthorized = (details?: string) =>
  NextResponse.json({ error: "Token ou sessão de autorização necessária", details }, { status: 401 })

export async function PUT(request: Request) {
  try {
    const { user, error: authError, db } = await authenticateRequest()
    if (authError || !user) return unauthorized(authError?.message)

    const parsed = updateProfileSchema.safeParse(await request.json())
    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Dados de perfil inválidos"
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const outcome = await buildProfileService(db).updateOwn(user.id, parsed.data)

    if (outcome.kind === "slug_taken") {
      return NextResponse.json({ error: "Esse endereço de perfil (slug) já está em uso" }, { status: 409 })
    }
    if (outcome.kind === "failed") {
      // A mensagem do banco fica no log do servidor; o cliente só recebe o erro genérico (D4a).
      console.error("❌ Profile update failed:", outcome.message)
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
    }

    return NextResponse.json({ message: "Perfil atualizado com sucesso", profile: outcome.profile })
  } catch (error) {
    console.error("❌ Unexpected profile update error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { user, error: authError, db } = await authenticateRequest()
    if (authError || !user) return unauthorized(authError?.message)

    const outcome = await buildProfileService(db).getOwn(user)

    if (outcome.kind === "failed") {
      const error = outcome.stage === "create" ? "Erro ao criar perfil" : "Erro ao buscar perfil"
      console.error(`❌ Profile ${outcome.stage} failed:`, outcome.message)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ profile: outcome.profile })
  } catch (error) {
    console.error("❌ Unexpected profile fetch error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
