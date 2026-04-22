import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Marcar perfil como solicitante de mentor
    const { data, error } = await (supabase
      .from("profiles" as any)
      // @ts-ignore
      .update({ is_pending_mentor: true })
      .eq("id", user.id)
      .select()
      .single() as any)

    if (error) throw error

    return successResponse(data, "Solicitação enviada com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
