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

    // 1. Verificar autenticação
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body = await request.json()
    const { mentor_id, scheduled_at, duration_minutes, mentorship_topics, notes_mentee } = body

    if (!mentor_id || !scheduled_at) {
      return errorResponse("Missing required fields", "INVALID_INPUT", 400)
    }

    // 2. Verificar se o mentor existe e está verificado
    const { data: mentor, error: mentorError } = await supabase
      .from("profiles")
      .select("id, verified")
      .eq("id", mentor_id)
      .returns<any>()
      .single()

    if (mentorError || !mentor) {
      return errorResponse("Mentor not found", "NOT_FOUND", 404)
    }

    if (!mentor.verified) {
      return errorResponse("Mentor is not verified", "FORBIDDEN", 403)
    }

    // 3. Criar agendamento
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        mentor_id,
        mentee_id: user.id,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        mentorship_topics: mentorship_topics || [],
        notes_mentee: notes_mentee || "",
        status: "pending"
      } as any)
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url),
        mentee:profiles!mentee_id(full_name, avatar_url)
      `)
      .returns<any[]>()
      .single()

    if (insertError) throw insertError

    return successResponse(appointment, "Mentorship scheduled successfully", 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get("mentorId")
    const menteeId = searchParams.get("menteeId")

    let query = supabase
      .from("appointments")
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url),
        mentee:profiles!mentee_id(full_name, avatar_url)
      `)

    if (mentorId) query = query.eq("mentor_id", mentorId)
    if (menteeId) query = query.eq("mentee_id", menteeId)

    const { data, error } = await query
      .order("scheduled_at", { ascending: false })
      .returns<any[]>()

    if (error) throw error

    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}
