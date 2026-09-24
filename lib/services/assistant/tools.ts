import { z } from "zod"
import { SupabaseClient } from "@supabase/supabase-js"
import { mentorService } from "@/lib/services/mentors/mentors.service"
import { mentorPublicService } from "@/lib/services/mentors/mentor-public.service"
import { computeAvailableSlots } from "@/lib/services/appointments/availability.service"

// --- 1. searchMentors ---

export const searchMentorsInput = z.object({
  query: z.string().trim().min(2).max(200)
    .describe("Tema, habilidade ou objetivo em linguagem natural, ex.: 'transição de carreira para dados'"),
  limit: z.number().int().min(1).max(5).default(3)
})

/** Enxuto: o único formato que chega ao LLM (economiza tokens, sem PII de contato). */
export const mentorLlmDto = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.string(),
  skills: z.array(z.string()).max(5),
  bio: z.string().max(200),
  profileUrl: z.string()
})
export type MentorLlmDto = z.infer<typeof mentorLlmDto>

/** Card: o que o `mentors_found` (SSE) manda para renderizar `MentorCard` na UI. */
export const mentorCardDto = z.object({
  id: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  job_title: z.string().nullable(),
  company: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  languages: z.array(z.string()).nullable(),
  mentorship_topics: z.array(z.string()).nullable(),
  inclusive_tags: z.array(z.string()).nullable(),
  expertise_areas: z.array(z.string()).nullable(),
  availability_status: z.string().nullable(),
  average_rating: z.number().nullable(),
  total_reviews: z.number().nullable(),
  total_sessions: z.number().nullable(),
  experience_years: z.number().nullable(),
  slug: z.string().nullable()
})
export type MentorCardDto = z.infer<typeof mentorCardDto>

export interface SearchMentorsResult {
  /** Vai para o LLM (conteúdo da tool). */
  forLlm: MentorLlmDto[]
  /** Vai para o evento SSE `mentors_found` (artifact da tool, não visto pelo modelo). */
  forCard: MentorCardDto[]
}

export async function searchMentors(
  supabase: SupabaseClient,
  input: z.infer<typeof searchMentorsInput>
): Promise<SearchMentorsResult> {
  let result = await mentorService.searchCatalog({
    filters: { search: input.query, sortBy: "relevance" },
    page: 0,
    limit: input.limit
  })

  // If specific query returned 0 matches, fallback to catalog top mentors
  if (!result.data || result.data.length === 0) {
    result = await mentorService.searchCatalog({
      filters: { sortBy: "relevance" },
      page: 0,
      limit: input.limit
    })
  }

  // safeParse strips every column outside the DTO and drops a malformed row
  // instead of failing the whole search.
  const forCard: MentorCardDto[] = (result.data ?? []).flatMap((row: unknown) => {
    const parsed = mentorCardDto.safeParse(row)
    return parsed.success && (parsed.data.slug || parsed.data.id) ? [parsed.data] : []
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
  const forLlm: MentorLlmDto[] = forCard.map((m) => {
    const slug = (m.slug || m.id) as string
    const skills = [...new Set([...(m.expertise_areas ?? []), ...(m.mentorship_topics ?? [])])].slice(0, 5)
    return {
      slug,
      name: m.full_name || "Mentor",
      role: m.job_title || "Mentor",
      skills,
      bio: (m.bio || "").slice(0, 200),
      profileUrl: `${baseUrl}/mentors/${slug}`
    }
  })

  return { forLlm, forCard }
}


// --- 2. getMentorAvailability ---

export const getMentorAvailabilityInput = z.object({
  slug: z.string().trim().min(1).describe("Slug público do mentor (vem de searchMentors)"),
  days: z.number().int().min(1).max(14).default(7)
})

export interface AvailabilitySlot {
  date: string
  startTime: string
  endTime: string
}

export interface MentorAvailability {
  mentorName: string
  slots: AvailabilitySlot[]
  bookingUrl: string
  note: string
}

export async function getMentorAvailability(
  supabase: SupabaseClient,
  input: z.infer<typeof getMentorAvailabilityInput>
): Promise<MentorAvailability | null> {
  const mentorData = await mentorPublicService.getMentorBySlugOrId(input.slug)
  
  if (!mentorData || !mentorData.mentor) {
    return null
  }

  const mentorId = mentorData.mentor.id
  const mentorName = `${mentorData.mentor.first_name} ${mentorData.mentor.last_name}`.trim()
  const mentorSlug = mentorData.mentor.slug || mentorId

  const startDate = new Date()
  const endDate = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000)

  const rawSlots = await computeAvailableSlots(supabase, mentorId, startDate, endDate)

  const slots = rawSlots.map(s => ({
    date: s.date,
    startTime: s.start_time.substring(0, 5),
    endTime: s.end_time.substring(0, 5)
  }))

  return {
    mentorName,
    slots,
    bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/mentors/${mentorSlug}`,
    note: "Horários no fuso de Brasília (America/Sao_Paulo). Agendamento exige login."
  }
}


// --- 3. explainHowItWorks ---

export const explainHowItWorksInput = z.object({
  topic: z.enum(["overview", "mentee", "mentor", "organizations", "cost"]).default("overview")
})

export interface HowItWorks {
  topic: string
  answer: string
  links: { label: string; url: string }[]
}

export function explainHowItWorks(input: z.infer<typeof explainHowItWorksInput>): HowItWorks {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
  
  const content = {
    overview: {
      answer: "A Menvo é a maior plataforma brasileira de mentoria voluntária e gratuita 1-a-1. Nós conectamos talentos em início ou transição de carreira a profissionais de tecnologia, design, produtos e dados.",
      links: [
        { label: "Catálogo de Mentores", url: `${baseUrl}/mentors` },
        { label: "Quiz de Carreira", url: `${baseUrl}/quiz` }
      ]
    },
    mentee: {
      answer: "Como mentorado, você pode buscar profissionais experientes e agendar sessões de mentoria online sem pagar nada. Você terá apoio em transição de carreira, entrevistas, revisão de currículo ou dúvidas técnicas.",
      links: [
        { label: "Buscar Mentor", url: `${baseUrl}/mentors` }
      ]
    },
    mentor: {
      answer: "Mentores atuam de forma voluntária, compartilhando seu conhecimento prático e ajudando a democratizar o acesso à tecnologia no Brasil. A plataforma gerencia sua agenda, sincronizando automaticamente com o Google Calendar.",
      links: [
        { label: "Como Funciona", url: `${baseUrl}/how-it-works` }
      ]
    },
    organizations: {
      answer: "A Menvo possui páginas próprias para ONGs e empresas parceiras. Nessas páginas, os beneficiários e colaboradores vinculados podem se conectar com a rede de mentores de forma centralizada.",
      links: [
        { label: "Página Inicial", url: `${baseUrl}` }
      ]
    },
    cost: {
      answer: "A plataforma é 100% gratuita para os mentorados. Todo o ecossistema é mantido pela dedicação e trabalho voluntário de profissionais qualificados que querem devolver valor à comunidade.",
      links: []
    }
  }

  const data = content[input.topic] || content.overview

  return {
    topic: input.topic,
    answer: data.answer,
    links: data.links
  }
}

// --- 4. saveFeedback ---

export const saveFeedbackInput = z.object({
  rating: z.number().int().min(1).max(5).describe("Avaliação de 1 a 5"),
  comment: z.string().describe("Comentário ou feedback em texto sobre a experiência ou resposta")
})

export async function saveFeedback(
  supabase: SupabaseClient,
  input: z.infer<typeof saveFeedbackInput>
): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  const insertData = {
    user_id: user?.id || null,
    rating: input.rating,
    comment: input.comment,
    page_url: "/assistant"
  }

  const { error } = await supabase.from("feedback").insert(insertData)
  
  if (error) {
    console.error("Erro ao salvar feedback via assistente:", error)
    return { success: false, message: "Não foi possível salvar o feedback no momento." }
  }

  return { success: true, message: "Feedback salvo com sucesso." }
}

// --- 5. getMyAppointments ---

export const getMyAppointmentsInput = z.object({
  limit: z.number().int().min(1).max(10).default(5)
    .describe("Quantidade máxima de mentorias a retornar (padrão 5)")
})

export interface FormattedAppointment {
  id: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  partnerName: string
  partnerJobTitle: string | null
  meetLink: string | null
}

export async function getMyAppointments(
  supabase: SupabaseClient,
  userId: string,
  input: z.infer<typeof getMyAppointmentsInput>
): Promise<FormattedAppointment[]> {
  const { data: apts } = await supabase
    .from("appointments")
    .select(`
      id,
      status,
      scheduled_at,
      google_meet_link,
      meeting_link,
      mentor:profiles!mentor_id(full_name, job_title),
      mentee:profiles!mentee_id(full_name, job_title),
      mentor_id,
      mentee_id
    `)
    .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true })
    .limit(input.limit)

  if (!apts || apts.length === 0) {
    return []
  }

  return apts.map((apt: any) => {
    const isUserMentor = apt.mentor_id === userId
    const partner = isUserMentor ? apt.mentee : apt.mentor
    const partnerObj = Array.isArray(partner) ? partner[0] : partner
    const dateObj = new Date(apt.scheduled_at)

    return {
      id: apt.id,
      date: dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: apt.status,
      partnerName: partnerObj?.full_name || (isUserMentor ? "Mentorado" : "Mentor"),
      partnerJobTitle: partnerObj?.job_title || null,
      meetLink: apt.status === "confirmed" ? (apt.google_meet_link || apt.meeting_link || null) : null
    }
  })
}

// --- 6. getPendingEvaluations ---

export const getPendingEvaluationsInput = z.object({})

export interface PendingEvaluation {
  appointmentId: string
  mentorName: string
  mentorJobTitle: string | null
  date: string
  time: string
  reviewUrl: string
}

export async function getPendingEvaluations(
  supabase: SupabaseClient,
  userId: string,
  role: string
): Promise<PendingEvaluation[] | { message: string }> {
  // Invariant #2: Only mentees evaluate mentors
  if (role === "mentor") {
    return { message: "Mentores não avaliam mentorados na plataforma Menvo." }
  }

  const { data: completedApts } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      mentor:profiles!mentor_id(full_name, job_title)
    `)
    .eq("mentee_id", userId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })

  if (!completedApts || completedApts.length === 0) {
    return []
  }

  const { data: feedbacks } = await supabase
    .from("appointment_feedbacks")
    .select("appointment_id")
    .eq("reviewer_id", userId)

  const reviewedIds = new Set((feedbacks || []).map((f: any) => f.appointment_id))
  const pending = completedApts.filter((a: any) => !reviewedIds.has(a.id))

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"

  return pending.map((apt: any) => {
    const mentor = Array.isArray(apt.mentor) ? apt.mentor[0] : apt.mentor
    const dateObj = new Date(apt.scheduled_at)
    return {
      appointmentId: apt.id,
      mentorName: mentor?.full_name || "Mentor",
      mentorJobTitle: mentor?.job_title || null,
      date: dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      reviewUrl: `${baseUrl}/mentee/my-mentorships`
    }
  })
}

// --- 7. getMentorRequests ---

export const getMentorRequestsInput = z.object({})

export interface MentorRequest {
  appointmentId: string
  menteeName: string
  menteeJobTitle: string | null
  date: string
  time: string
  manageUrl: string
}

export async function getMentorRequests(
  supabase: SupabaseClient,
  userId: string,
  role: string
): Promise<MentorRequest[] | { message: string }> {
  if (role !== "mentor" && role !== "admin") {
    return { message: "Apenas mentores podem visualizar solicitações de mentoria." }
  }

  const { data: pendingApts } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      mentee:profiles!mentee_id(full_name, job_title)
    `)
    .eq("mentor_id", userId)
    .eq("status", "pending")
    .order("scheduled_at", { ascending: true })

  if (!pendingApts || pendingApts.length === 0) {
    return []
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"

  return pendingApts.map((apt: any) => {
    const mentee = Array.isArray(apt.mentee) ? apt.mentee[0] : apt.mentee
    const dateObj = new Date(apt.scheduled_at)
    return {
      appointmentId: apt.id,
      menteeName: mentee?.full_name || "Mentorado",
      menteeJobTitle: mentee?.job_title || null,
      date: dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      manageUrl: `${baseUrl}/mentor/appointments`
    }
  })
}

// --- Registro único ---
export const assistantTools = {
  searchMentors,
  getMentorAvailability,
  explainHowItWorks,
  saveFeedback,
  getMyAppointments,
  getPendingEvaluations,
  getMentorRequests
}
