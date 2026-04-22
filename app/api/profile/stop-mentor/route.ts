import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
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

    // 1. Remover a role de mentor
    const { data: mentorRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'mentor')
        .single()

    if (mentorRole) {
        await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user.id)
            .eq('role_id', mentorRole.id)
    }

    // 2. Garantir que tenha pelo menos a role de mentee
    const { data: menteeRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'mentee')
        .single()

    if (menteeRole) {
        await supabase
            .from('user_roles')
            .upsert({ user_id: user.id, role_id: menteeRole.id })
    }

    // 3. Resetar flags no perfil
    const { data, error } = await supabase
      .from("profiles")
      .update({ 
          is_pending_mentor: false,
          verified: false,
          is_public: false // Ocultar por segurança ao mudar de role
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, "Você não é mais um mentor")
  } catch (error) {
    return handleApiError(error)
  }
}
