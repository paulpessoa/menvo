import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { updateUserRoleSchema } from "@/lib/schemas/profile"
import { buildAccountRoleService } from "@/lib/services/profile/account-role.composition"

/**
 * POST /api/profile/role - escolhe o papel (mentor ou mentorado) no
 * onboarding. Fina: auth, Zod, service, status. A troca de papel e a
 * exceção de `service_role` (ADR 0008, E2) moram em `account-role.*`.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const validation = updateUserRoleSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }

    const { role, profileData } = validation.data
    const outcome = await buildAccountRoleService(supabase).chooseRole(user, role, profileData)

    if (outcome.kind === "approved_mentor") {
      return NextResponse.json(
        {
          error:
            "Você já é mentor aprovado. Para voltar a ser apenas mentorado, use \"Deixar de ser mentor\" no seu perfil.",
        },
        { status: 409 }
      )
    }
    if (outcome.kind === "failed") {
      return NextResponse.json({ error: "Erro ao salvar role" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Role atualizada com sucesso",
      role: outcome.role,
      status: outcome.status,
    })
  } catch (error) {
    console.error("[POST /api/profile/role] Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
