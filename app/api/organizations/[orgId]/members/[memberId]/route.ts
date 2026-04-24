import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string, memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params
    const body = await request.json()

    // 1. Validar se quem chama é admin da org (Opcional, mas recomendado para segurança)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Atualiza apenas a tabela relacional
    const { role } = body;
    if (!role) return errorResponse("Role is required", "VALIDATION_ERROR", 400)

    const { data: member, error: updateError } = await (supabase
      .from("organization_members") as any)
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (updateError) throw updateError

    return successResponse(member, "Papel atualizado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string, memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Tentar deletar de organization_members
    const { error: deleteMemberError, count: memberCount } = await supabase
      .from("organization_members")
      .delete({ count: 'exact' })
      .eq("id", memberId)
      .eq("organization_id", orgId);

    if (deleteMemberError) throw deleteMemberError

    // 2. Se não deletou nada, tenta deletar de organization_invitations
    if (memberCount === 0) {
      const { error: deleteInviteError } = await (supabase
        .from("organization_invitations") as any)
        .delete()
        .eq("id", memberId)
        .eq("organization_id", orgId);
        
      if (deleteInviteError) throw deleteInviteError
    }

    return successResponse(null, "Removido com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
