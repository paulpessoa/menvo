import { supabase } from "@/lib/services/auth/auth.service"
import type { Database } from "@/lib/types/supabase"
import type {
  Appointment,
  AppointmentWithProfiles,
  MentorAvailability,
  AppointmentStatus
} from "@/lib/types/models/mentorship"

export type {
  Appointment,
  AppointmentWithProfiles,
  MentorAvailability,
  AppointmentStatus
}

type MentorAvailabilityInsert = Database["public"]["Tables"]["mentor_availability"]["Insert"]
type MentorAvailabilityUpdate = Database["public"]["Tables"]["mentor_availability"]["Update"]

// =============================================
// INTERFACES E TIPOS
// =============================================

export interface SessionRequest {
  mentor_id: string
  requested_date: string
  requested_start_time: string
  requested_end_time: string
  topic: string
  description?: string
  mentee_notes?: string
  timezone?: string
}

export interface SessionResponse {
  session_id: string
  status: "confirmed" | "rejected"
  mentor_response?: string
  meeting_link?: string
}

// =============================================
// MENTOR AVAILABILITY SERVICE
// =============================================

export const mentorAvailabilityService = {
  // Obter disponibilidade de um mentor
  getMentorAvailability: async (
    mentorId: string
  ): Promise<MentorAvailability[]> => {
    const { data, error } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) throw error
    return (data || []).map((slot) => ({
      ...slot,
      id: slot.id as unknown as number,
      is_active: true,
      timezone: slot.timezone || "America/Sao_Paulo"
    })) as MentorAvailability[]
  },

  // Adicionar horário de disponibilidade
  addAvailability: async (
    availabilityStatus: Omit<
      MentorAvailability,
      "id" | "created_at" | "updated_at"
    >
  ): Promise<MentorAvailability> => {
    const payload: MentorAvailabilityInsert = {
      mentor_id: availabilityStatus.mentor_id,
      day_of_week: availabilityStatus.day_of_week,
      start_time: availabilityStatus.start_time,
      end_time: availabilityStatus.end_time,
      timezone: availabilityStatus.timezone || "America/Sao_Paulo"
    }

    const { data, error } = await supabase
      .from("mentor_availability")
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      id: data.id as unknown as number,
      is_active: true,
      timezone: data.timezone || "America/Sao_Paulo"
    } as MentorAvailability
  },

  // Atualizar disponibilidade
  updateAvailability: async (
    id: string,
    updates: Partial<MentorAvailability>
  ): Promise<MentorAvailability> => {
    const payload: MentorAvailabilityUpdate = {
      day_of_week: updates.day_of_week,
      start_time: updates.start_time,
      end_time: updates.end_time,
      timezone: updates.timezone
    }

    const { data, error } = await supabase
      .from("mentor_availability")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      id: data.id as unknown as number,
      is_active: true,
      timezone: data.timezone || "America/Sao_Paulo"
    } as MentorAvailability
  },

  // Remover disponibilidade
  removeAvailability: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("mentor_availability")
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  // Definir disponibilidade completa do mentor (substitui todas)
  setMentorAvailability: async (
    mentorId: string,
    availabilities: Omit<
      MentorAvailability,
      "id" | "mentor_id" | "created_at" | "updated_at"
    >[]
  ): Promise<MentorAvailability[]> => {
    // 1. Remover disponibilidades antigas do mentor
    const { error: deleteError } = await supabase
      .from("mentor_availability")
      .delete()
      .eq("mentor_id", mentorId)

    if (deleteError) throw deleteError

    if (availabilities.length === 0) return []

    // 2. Inserir as novas disponibilidades
    const newAvailabilities: MentorAvailabilityInsert[] = availabilities.map((av) => ({
      mentor_id: mentorId,
      day_of_week: av.day_of_week,
      start_time: av.start_time,
      end_time: av.end_time,
      timezone: av.timezone || "America/Sao_Paulo"
    }))

    const { data, error } = await supabase
      .from("mentor_availability")
      .insert(newAvailabilities)
      .select()

    if (error) throw error
    return (data || []).map((item) => ({
      ...item,
      id: item.id as unknown as number,
      is_active: true,
      timezone: item.timezone || "America/Sao_Paulo"
    })) as MentorAvailability[]
  }
}

// =============================================
// MENTORSHIP SESSIONS SERVICE
// =============================================

export const mentorshipSessionsService = {
  // Solicitar sessão de mentoria
  requestSession: async (
    request: SessionRequest
  ): Promise<AppointmentWithProfiles> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    const sessionData = {
      mentor_id: request.mentor_id,
      mentee_id: user.id,
      requested_date: request.requested_date,
      requested_start_time: request.requested_start_time,
      requested_end_time: request.requested_end_time,
      topic: request.topic,
      notes_mentee: request.mentee_notes,
      duration_minutes: 60,
      status: "pending"
    }

    const { data, error } = await (supabase
      .from("appointments")
      .insert([sessionData as any])
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email, avatar_url),
        mentee:profiles!mentee_id(first_name, last_name, email, avatar_url)
      `
      )
      .single() as any)

    if (error) throw error
    return data as AppointmentWithProfiles
  },

  // Responder a uma solicitação (mentor)
  respondToSession: async (
    response: SessionResponse
  ): Promise<AppointmentWithProfiles> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    const updates = {
      status: response.status,
      mentor_response: response.mentor_response,
      meeting_link: response.meeting_link
    }

    const { data, error } = await (supabase
      .from("appointments")
      .update(updates as any)
      .eq("id", response.session_id)
      .eq("mentor_id", user.id)
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email, avatar_url),
        mentee:profiles!mentee_id(first_name, last_name, email, avatar_url)
      `
      )
      .single() as any)

    if (error) throw error
    return data as AppointmentWithProfiles
  },

  // Obter sessões do mentor
  getMentorSessions: async (
    mentorId?: string,
    status?: AppointmentStatus
  ): Promise<AppointmentWithProfiles[]> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email, avatar_url),
        mentee:profiles!mentee_id(first_name, last_name, email, avatar_url)
      `
      )
      .eq("mentor_id", mentorId || user.id)
      .order("requested_date", { ascending: false })
      .order("requested_start_time", { ascending: false })

    if (status) {
      query = (query as any).eq("status", status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as any) || []
  },

  // Obter sessões do mentorado
  getMenteeSessions: async (
    menteeId?: string,
    status?: AppointmentStatus
  ): Promise<AppointmentWithProfiles[]> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email, avatar_url),
        mentee:profiles!mentee_id(first_name, last_name, email, avatar_url)
      `
      )
      .eq("mentee_id", menteeId || user.id)
      .order("requested_date", { ascending: false })
      .order("requested_start_time", { ascending: false })

    if (status) {
      query = (query as any).eq("status", status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as any) || []
  },

  // Marcar sessão como completa
  completeSession: async (
    sessionId: string,
    mentorNotes?: string
  ): Promise<Appointment> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    const { data, error } = await (supabase
      .from("appointments")
      .update({
        status: "completed",
        notes_mentor: mentorNotes,
        completed_at: new Date().toISOString()
      } as any)
      .eq("id", sessionId)
      .eq("mentor_id", user.id)
      .select()
      .single() as any)

    if (error) throw error
    return data as Appointment
  },

  // Cancelar sessão
  cancelSession: async (
    sessionId: string,
    reason?: string
  ): Promise<Appointment> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    const { data, error } = await (supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id
      } as any)
      .eq("id", sessionId)
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .select()
      .single() as any)

    if (error) throw error
    return data as Appointment
  },

  // Obter sessão específica
  getSession: async (sessionId: string): Promise<AppointmentWithProfiles> => {
    const { data, error } = await (supabase
      .from("appointments")
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email, avatar_url),
        mentee:profiles!mentee_id(first_name, last_name, email, avatar_url)
      `
      )
      .eq("id", sessionId)
      .single() as any)

    if (error) throw error
    return data as AppointmentWithProfiles
  },

  // Obter estatísticas do mentor
  getMentorStats: async (mentorId: string) => {
    const { data: sessions, error } = await supabase
      .from("appointments")
      .select("status")
      .eq("mentor_id", mentorId)

    if (error) throw error

    const s = (sessions as { status: string | null }[]) || []

    return {
      total: s.length,
      pending: s.filter((i) => i.status === "pending").length,
      confirmed: s.filter((i) => i.status === "confirmed").length,
      completed: s.filter((i) => i.status === "completed").length,
      rejected: s.filter((i) => i.status === "rejected").length,
      cancelled: s.filter((i) => i.status === "cancelled").length
    }
  },

  // Enviar feedback e completar agendamento
  submitFeedbackAndComplete: async ({
    appointmentId,
    reviewerId,
    reviewedId,
    rating,
    privateNotes,
    publicFeedback
  }: {
    appointmentId: string
    reviewerId: string
    reviewedId: string
    rating: number
    privateNotes?: string | null
    publicFeedback?: string | null
  }): Promise<void> => {
    const feedbackPayload: Database["public"]["Tables"]["appointment_feedbacks"]["Insert"] = {
      appointment_id: appointmentId,
      reviewer_id: reviewerId,
      reviewed_id: reviewedId,
      rating,
      private_notes: privateNotes || null,
      public_feedback: publicFeedback || null
    }

    const { error: feedbackError } = await (supabase
      .from("appointment_feedbacks") as any)
      .insert(feedbackPayload)

    if (feedbackError) throw feedbackError

    const appointmentPayload: Database["public"]["Tables"]["appointments"]["Update"] = {
      status: "completed",
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await (supabase
      .from("appointments") as any)
      .update(appointmentPayload)
      .eq("id", appointmentId)

    if (updateError) throw updateError
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const mentorshipUtils = {
  // Converter dia da semana para nome
  getDayName: (dayOfWeek: number, locale: string = "pt-BR") => {
    const days = {
      "pt-BR": [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado"
      ],
      "en-US": [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ]
    }
    return (
      days[locale as keyof typeof days]?.[dayOfWeek] || days["pt-BR"][dayOfWeek]
    )
  },

  // Formatar horário
  formatTime: (time: string) => {
    return time.substring(0, 5) // Remove segundos se houver
  },

  // Verificar se horário está disponível
  isTimeSlotAvailable: (
    availabilityStatus: MentorAvailability[],
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    return availabilityStatus.some(
      (slot) =>
        slot.day_of_week === dayOfWeek &&
        slot.start_time <= startTime &&
        slot.end_time >= endTime &&
        slot.is_active
    )
  },

  getNextOccurrence: (dayOfWeek: number, startTime: string): Date => {
    const now = new Date()
    const result = new Date()

    // Parse start time (HH:mm)
    const [hours, minutes] = startTime.split(":").map(Number)

    // Calculate days until next occurrence
    let daysUntil = (dayOfWeek - now.getDay() + 7) % 7

    // If today is the day, check if time has passed
    if (daysUntil === 0) {
      const scheduledTime = new Date()
      scheduledTime.setHours(hours, minutes, 0, 0)
      if (now > scheduledTime) {
        daysUntil = 7
      }
    }

    result.setDate(now.getDate() + daysUntil)
    result.setHours(hours, minutes, 0, 0)
    result.setSeconds(0, 0)

    return result
  },

  // Gerar slots de horário disponíveis
  generateTimeSlots: (
    availabilityStatus: MentorAvailability[],
    duration: number = 60
  ) => {
    const slots: { day: number; time: string; endTime: string }[] = []

    availabilityStatus.forEach((slot) => {
      const start = new Date(`2000-01-01T${slot.start_time}`)
      const end = new Date(`2000-01-01T${slot.end_time}`)

      while (start < end) {
        const slotEnd = new Date(start.getTime() + duration * 60000)
        if (slotEnd <= end) {
          slots.push({
            day: slot.day_of_week,
            time: start.toTimeString().substring(0, 5),
            endTime: slotEnd.toTimeString().substring(0, 5)
          })
        }
        start.setTime(start.getTime() + duration * 60000)
      }
    })

    return slots
  }
}

// Aliases para exportação unificada
export const mentorshipService = mentorshipSessionsService
