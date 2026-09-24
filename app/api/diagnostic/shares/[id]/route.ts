import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { diagnosticSharesService } from "@/lib/services/diagnostic/diagnostic-shares.service"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/diagnostic/shares/[id]
 * Retrieves the shared diagnostic insight for a mentor.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const insight = await diagnosticSharesService.getSharedDiagnosticForMentor(
      supabase,
      user.id,
      id
    )

    if (!insight) {
      return NextResponse.json(
        { error: "Compartilhamento não encontrado ou revogado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error("[GET /api/diagnostic/shares/[id]] Unexpected error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/diagnostic/shares/[id]
 * Revokes an existing diagnostic share.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await diagnosticSharesService.revokeShare(supabase, id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[DELETE /api/diagnostic/shares/[id]] Unexpected error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/diagnostic/shares/[id]
 * Also supports revocation via PATCH.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  return DELETE(request, { params })
}
