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
    const {
      // snake_case (API-direct callers)
      mentor_id,
      scheduled_at,
      duration_minutes,
      mentorship_topics,
      notes_mentee,
      // camelCase (frontend BookMentorshipModal)
      mentorId,
      scheduledAt,
      duration,
      message,
    } = body

    // Normalize: prefer snake_case if present, fall back to camelCase
    const resolvedMentorId = mentor_id ?? mentorId
    const resolvedScheduledAt = scheduled_at ?? scheduledAt
    const resolvedDuration = duration_minutes ?? duration ?? 45
    const resolvedNotes = notes_mentee ?? message ?? ""
    const resolvedTopics = mentorship_topics ?? []

    if (!resolvedMentorId || !resolvedScheduledAt) {
      return errorResponse("Missing required fields", "VALIDATION_ERROR", 400)
    }

    // 2. Verificar se o mentor existe e está verificado
    const { data: mentor, error: mentorError } = await (supabase
      .from("profiles")
      .select("id, verified")
      .eq("id", resolvedMentorId)
      .single() as any)

    if (mentorError || !mentor) {
      return errorResponse("Mentor not found", "NOT_FOUND", 404)
    }

    if (!mentor.verified) {
      return errorResponse("Mentor is not verified", "FORBIDDEN", 403)
    }

    // 3. Criar agendamento
    const { data: appointment, error: insertError } = await (supabase
      .from("appointments" as any)
      // @ts-ignore
      .insert({
        mentor_id: resolvedMentorId,
        mentee_id: user.id,
        scheduled_at: resolvedScheduledAt,
        duration_minutes: resolvedDuration,
        mentorship_topics: resolvedTopics,
        notes_mentee: resolvedNotes,
        status: "pending"
      })
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url),
        mentee:profiles!mentee_id(full_name, avatar_url)
      `)
      .single() as any)

    if (insertError) throw insertError

    return successResponse(appointment, "Mentorship scheduled successfully")
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
      .from("appointments" as any)
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url),
        mentee:profiles!mentee_id(full_name, avatar_url)
      `)

    if (mentorId) query = (query as any).eq("mentor_id", mentorId)
    if (menteeId) query = (query as any).eq("mentee_id", menteeId)

    const { data, error } = await (query as any)
      .order("scheduled_at", { ascending: false })

    if (error) throw error

    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}
