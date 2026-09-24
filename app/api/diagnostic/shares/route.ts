import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { diagnosticSharesService } from "@/lib/services/diagnostic/diagnostic-shares.service"
import { createDiagnosticShareSchema } from "@/lib/types/models/diagnostic-shares"

/**
 * GET /api/diagnostic/shares
 * Lists diagnostic shares for the current user.
 * - ?role=mentee (default): returns shares created by this user
 * - ?role=mentor: returns active shares where this user is the mentor
 * - ?quizResponseId=uuid: filters by quiz_response_id
 * - ?diagnosticSessionId=uuid: filters by diagnostic_session_id
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || "mentee"
    const quizResponseId = searchParams.get("quizResponseId") || undefined
    const diagnosticSessionId = searchParams.get("diagnosticSessionId") || undefined

    if (role === "mentor") {
      const shares = await diagnosticSharesService.listSharesForMentor(supabase, user.id)
      return NextResponse.json({ shares })
    }

    const shares = await diagnosticSharesService.listSharesForMentee(supabase, user.id, {
      quizResponseId,
      diagnosticSessionId
    })

    return NextResponse.json({ shares })
  } catch (error: any) {
    console.error("[GET /api/diagnostic/shares] Unexpected error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/diagnostic/shares
 * Creates or reactivates a diagnostic share with a mentor.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createDiagnosticShareSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      )
    }

    // Security check: cannot share with oneself
    if (parsed.data.mentor_id === user.id) {
      return NextResponse.json(
        { error: "Não é possível compartilhar o diagnóstico com você mesmo" },
        { status: 400 }
      )
    }

    const share = await diagnosticSharesService.shareDiagnostic(
      supabase,
      user.id,
      parsed.data
    )

    return NextResponse.json({ success: true, share }, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/diagnostic/shares] Unexpected error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
