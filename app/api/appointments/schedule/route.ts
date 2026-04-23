import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import { sendAppointmentRequest } from "@/lib/email/brevo"
import { randomUUID } from "crypto"

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

    // 2. Verificar se o mentor existe, está verificado e buscar email para notificação
    const { data: mentor, error: mentorError } = await (supabase
      .from("profiles")
      .select("id, verified, full_name, email")
      .eq("id", resolvedMentorId)
      .single() as any)

    if (mentorError || !mentor) {
      return errorResponse("Mentor not found", "NOT_FOUND", 404)
    }

    if (!mentor.verified) {
      return errorResponse("Mentor is not verified", "FORBIDDEN", 403)
    }

    // Buscar nome do mentee para o email
    const { data: menteeProfile } = await (supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single() as any)

    // 3. Criar agendamento com token de confirmação por email
    // Colunas reais validadas via: supabase gen types (lib/types/supabase.ts)
    const actionToken = randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias

    const { data: appointment, error: insertError } = await (supabase
      .from("appointments")
      .insert({
        mentor_id: resolvedMentorId,
        mentee_id: user.id,
        scheduled_at: resolvedScheduledAt,
        duration_minutes: resolvedDuration,
        topic: Array.isArray(resolvedTopics) ? resolvedTopics.join(", ") : "",
        notes_mentee: resolvedNotes,
        message: resolvedNotes,
        status: "pending",
        action_token: actionToken,
        token_expires_at: tokenExpiresAt,
      } as any)
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url),
        mentee:profiles!mentee_id(full_name, avatar_url)
      `)
      .single() as any)

    if (insertError) {
      console.error("[schedule] DB insert error:", JSON.stringify(insertError))
      throw insertError
    }

    // 4. Notificar mentor por email (não bloqueia a resposta se falhar)
    if (mentor.email) {
      sendAppointmentRequest({
        mentorEmail: mentor.email,
        mentorName: mentor.full_name || "Mentor",
        menteeName: menteeProfile?.full_name || user.email || "Mentee",
        scheduledAt: resolvedScheduledAt,
        message: resolvedNotes,
        token: actionToken,
      }).catch((emailErr) => {
        // Email failure não deve quebrar o agendamento
        console.error("[schedule] Email send failed (non-critical):", emailErr)
      })
    } else {
      console.warn("[schedule] Mentor sem email cadastrado, notificação não enviada:", resolvedMentorId)
    }

    return successResponse(appointment, "Mentorship scheduled successfully")
  } catch (error) {
    console.error("[schedule] Unexpected error:", error)
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
