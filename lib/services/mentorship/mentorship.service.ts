import { supabase } from "@/lib/services/auth/auth.service"
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
    const { data, error } = await (supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }) as any)

    if (error) throw error
    return data as MentorAvailability[]
  },

  // Adicionar horário de disponibilidade
  addAvailability: async (
    availability_status: Omit<
      MentorAvailability,
      "id" | "created_at" | "updated_at"
    >
  ): Promise<MentorAvailability> => {
    const { data, error } = await (supabase
      .from("mentor_availability")
      .insert([availability_status])
      .select()
      .single() as any)

    if (error) throw error
    return data as MentorAvailability
  },

  // Atualizar disponibilidade
  updateAvailability: async (
    id: string,
    updates: Partial<MentorAvailability>
  ): Promise<MentorAvailability> => {
    const { data, error } = await (supabase
      .from("mentor_availability")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single() as any)

    if (error) throw error
    return data as MentorAvailability
  },

  // Remover disponibilidade (soft delete)
  removeAvailability: async (id: string): Promise<void> => {
    const { error } = await (supabase
      .from("mentor_availability")
      .update({ is_active: false } as any)
      .eq("id", id) as any)

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
    // Primeiro, desativar todas as disponibilidades existentes
    await (supabase
      .from("mentor_availability")
      .update({ is_active: false } as any)
      .eq("mentor_id", mentorId) as any)

    // Depois, inserir as novas disponibilidades
    const newAvailabilities = availabilities.map((av) => ({
      ...av,
      mentor_id: mentorId
    }))

    const { data, error } = await (supabase
      .from("mentor_availability")
      .insert(newAvailabilities as any)
      .select() as any)

    if (error) throw error
    return data as MentorAvailability[]
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
      timezone: request.timezone || "America/Sao_Paulo",
      status: "pending"
    }

    const { data, error } = await (supabase
      .from("appointments")
      .insert([sessionData as any])
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email),
        mentee:profiles!mentee_id(first_name, last_name, email)
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
      meeting_link: response.meeting_link,
      responded_at: new Date().toISOString()
    }

    const { data, error } = await (supabase
      .from("appointments")
      .update(updates as any)
      .eq("id", response.session_id)
      .eq("mentor_id", user.id)
      .select(
        `
        *,
        mentor:profiles!mentor_id(first_name, last_name, email),
        mentee:profiles!mentee_id(first_name, last_name, email)
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
    return data as any as AppointmentWithProfiles[]
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
    return data as any as AppointmentWithProfiles[]
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
        mentor_response: reason
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
    const { data: sessions, error } = await (supabase
      .from("appointments")
      .select("status")
      .eq("mentor_id", mentorId) as any)

    if (error) throw error

    const s = (sessions as any[]) || []

    return {
      total: s.length,
      pending: s.filter((i) => i.status === "pending").length,
      confirmed: s.filter((i) => i.status === "confirmed").length,
      completed: s.filter((i) => i.status === "completed").length,
      rejected: s.filter((i) => i.status === "rejected").length,
      cancelled: s.filter((i) => i.status === "cancelled").length
    }
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
    availability_status: MentorAvailability[],
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    return availability_status.some(
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
    availability_status: MentorAvailability[],
    duration: number = 60
  ) => {
    const slots: { day: number; time: string; endTime: string }[] = []

    availability_status.forEach((slot) => {
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
