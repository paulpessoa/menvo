import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// GET - Buscar solicitações de validação (apenas admins)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se usuário é admin
    const { data: isAdminResult, error: adminError } = await supabase
      .rpc("is_admin", { user_id: user.id })

    if (adminError || !isAdminResult) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      )
    }

    // Buscar todas as solicitações de validação
    const { data: requests, error } = await supabase
      .from("validation_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar solicitações:", error)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requests: requests || []
    })

  } catch (error) {
    console.error("Erro no API Route GET /api/admin/validation-requests:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Aprovar ou rejeitar solicitação (apenas admins)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se usuário é admin
    const { data: isAdminResult, error: adminError } = await supabase
      .rpc("is_admin", { user_id: user.id })

    if (adminError || !isAdminResult) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { request_id, action, review_notes } = body

    if (!request_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      )
    }

    // Buscar a solicitação
    const { data: validationRequest, error: fetchError } = await supabase
      .from("validation_requests")
      .select("*")
      .eq("id", request_id)
      .single()

    if (fetchError || !validationRequest) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      )
    }

    // Atualizar status da solicitação
    const { error: updateRequestError } = await supabase
      .from("validation_requests")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
      })
      .eq("id", request_id)

    if (updateRequestError) {
      console.error("Erro ao atualizar solicitação:", updateRequestError)
      return NextResponse.json(
        { error: "Erro ao atualizar solicitação" },
        { status: 500 }
      )
    }

    // Se aprovado, atualizar is_validated no perfil
    if (action === "approve") {
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ is_validated: true })
        .eq("user_id", validationRequest.user_id)

      if (updateProfileError) {
        console.error("Erro ao validar perfil:", updateProfileError)
        return NextResponse.json(
          { error: "Erro ao validar perfil" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Perfil ${action === "approve" ? "aprovado" : "rejeitado"} com sucesso`
    })

  } catch (error) {
    console.error("Erro no API Route PUT /api/admin/validation-requests:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
