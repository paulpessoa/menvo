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

    // 1. Buscar a role de mentor
    const { data: mentorRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'mentor')
        .single()

    if (mentorRole) {
        // Remover a role de mentor do usuário
        await (supabase
            .from('user_roles') as any)
            .delete()
            .eq('user_id', user.id)
            .eq('role_id', (mentorRole as any).id)
    }

    // 2. Garantir que tenha pelo menos a role de mentee
    const { data: menteeRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'mentee')
        .single()

    if (menteeRole) {
        // user_roles has no unique constraint on (user_id, role_id) — its
        // primary key is a synthetic `id` column we never pass — so a bare
        // `.upsert()` here never actually detects a conflict and behaves
        // as a plain INSERT every call, silently creating a duplicate
        // "mentee" row for a user who calls stop-mentor more than once.
        // Check-then-insert instead.
        const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .eq('role_id', (menteeRole as any).id)
            .maybeSingle()

        if (!existingRole) {
            await (supabase
                .from('user_roles') as any)
                .insert({ user_id: user.id, role_id: (menteeRole as any).id })
        }
    }

    // 3. Resetar flags no perfil
    const { data, error } = await (supabase
      .from("profiles") as any)
      .update({ 
          is_pending_mentor: false,
          verified: false,
          is_public: false 
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
