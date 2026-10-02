import { createClient } from "@/lib/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
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
        // Remover a role de mentor do usuário usando admin
        await supabaseAdmin
            .from('user_roles')
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
        // user_roles has no unique constraint on (user_id, role_id) - its
        // primary key is a synthetic `id` column we never pass - so a bare
        // `.upsert()` here never actually detects a conflict and behaves
        // as a plain INSERT every call, silently creating a duplicate
        // "mentee" row for a user who calls stop-mentor more than once.
        // Check-then-insert instead.
        const { data: existingRole } = await supabaseAdmin
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .eq('role_id', (menteeRole as any).id)
            .maybeSingle()

        if (!existingRole) {
            await supabaseAdmin
                .from('user_roles')
                .insert({ user_id: user.id, role_id: (menteeRole as any).id })
        }
    }

    // 3. Tirar a verificação (só pela RPC: o usuário não tem grant no status)
    // e esconder o perfil. Os textos de mentor ficam, caso volte a mentorar.
    const { error: withdrawError } = await supabase.rpc("withdraw_mentor_verification")
    if (withdrawError) throw withdrawError

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({ is_public: false })
      .eq("id", user.id)
      .select("id, is_public")
      .single()

    if (error) throw error

    const data = { ...profile, verified: false }

    return successResponse(data, "Você não é mais um mentor")
  } catch (error) {
    return handleApiError(error)
  }
}
