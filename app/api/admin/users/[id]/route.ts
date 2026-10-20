import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"
import { adminUserPatchBodySchema } from "@/lib/schemas/admin-users"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { adminSelfActionResponse } from "@/lib/services/admin/self-action.error"
import { buildAdminUsersService } from "@/lib/services/admin/users.composition"

/**
 * Edita um usuário no painel admin. A rota autentica (`requireAdmin`), valida o
 * corpo e delega: `assertAdmin`, a regra de não retirar o próprio `admin` e a
 * auditoria ficam no service. O erro 500 tem mensagem fixa (o texto do banco
 * não sai para o cliente).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const parsed = adminUserPatchBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const supabase = await createClient()
    const updated = await buildAdminUsersService(supabase).updateUser({
      actorId: guard.admin.userId,
      targetId: id,
      body: parsed.data,
      request,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const known = adminForbiddenResponse(error) ?? adminSelfActionResponse(error)
    if (known) return known
    console.error("Erro no update de admin:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    if (id === guard.admin.userId) {
      return NextResponse.json(
        { error: "Você não pode remover a própria conta de administrador" },
        { status: 400 }
      )
    }

    const result = await deleteUserCompletely(id, { source: "admin" })

    return NextResponse.json({
      success: true,
      message: "Usuário removido permanentemente",
      filesRemoved: result.filesRemoved
    })

  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
