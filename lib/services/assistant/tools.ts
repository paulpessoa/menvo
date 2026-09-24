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
  comment: z.string().optional().describe("Comentário ou feedback em texto sobre a experiência ou resposta"),
  source: z.enum(["assistant", "diagnostic", "session", "platform"]).default("assistant").describe("Origem do feedback"),
  context: z.record(z.unknown()).optional().describe("Contexto adicional em formato de objeto JSON")
})

export async function saveFeedback(
  supabase: SupabaseClient,
  input: z.infer<typeof saveFeedbackInput>
): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  const insertData = {
    user_id: user?.id || null,
    rating: input.rating,
    comment: input.comment || null,
    source: input.source || "assistant",
    context: input.context || {},
    page_url: input.source === "diagnostic" ? "/assistant?mode=diagnostic" : "/assistant"
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
      status,
      mentor:profiles!mentor_id(full_name, job_title)
    `)
    .eq("mentee_id", userId)
    .in("status", ["confirmed", "completed"])
    .order("scheduled_at", { ascending: false })

  if (!completedApts || completedApts.length === 0) {
    return []
  }

  const nowIso = new Date().toISOString()
  const finishedApts = completedApts.filter(
    (a: any) => a.status === "completed" || (a.status === "confirmed" && a.scheduled_at < nowIso)
  )

  if (finishedApts.length === 0) {
    return []
  }

  const { data: feedbacks } = await supabase
    .from("appointment_feedbacks")
    .select("appointment_id")
    .eq("reviewer_id", userId)

  const reviewedIds = new Set((feedbacks || []).map((f: any) => f.appointment_id))
  const pending = finishedApts.filter((a: any) => !reviewedIds.has(a.id))

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

// --- 8. evaluateMentorshipSession ---

export const evaluateMentorshipSessionInput = z.object({
  appointmentId: z.string().uuid("ID do agendamento inválido")
    .describe("ID único do agendamento de mentoria a ser avaliado"),
  rating: z.number().int().min(1, "A nota deve ser de 1 a 5").max(5, "A nota deve ser de 1 a 5")
    .describe("Nota de avaliação da mentoria de 1 a 5 estrelas"),
  publicFeedback: z.string().max(2000, "Feedback público não pode exceder 2000 caracteres").optional()
    .describe("Comentário público sobre a experiência com o mentor (visível no perfil do mentor)"),
  privateNotes: z.string().max(2000, "Notas privadas não podem exceder 2000 caracteres").optional()
    .describe("Observações ou notas privadas opcionais para o mentor")
})

export interface EvaluateMentorshipResult {
  success: boolean
  message: string
}

export async function evaluateMentorshipSession(
  supabase: SupabaseClient,
  userId: string,
  input: z.infer<typeof evaluateMentorshipSessionInput>
): Promise<EvaluateMentorshipResult> {
  let client: SupabaseClient = supabase
  try {
    const { createServiceRoleClient } = await import("@/lib/utils/supabase/service-role")
    client = createServiceRoleClient()
  } catch {
    client = supabase
  }

  // 1. Fetch appointment to verify ownership and status
  const { data: appointment, error: fetchError } = await client
    .from("appointments")
    .select("id, mentor_id, mentee_id, status")
    .eq("id", input.appointmentId)
    .single()

  if (fetchError || !appointment) {
    return { success: false, message: "Agendamento de mentoria não encontrado." }
  }

  // 2. Invariant #2: Only the mentee can evaluate the mentor
  if (appointment.mentee_id !== userId) {
    return { success: false, message: "Apenas o mentorado participante pode avaliar esta mentoria." }
  }

  // 3. Status check: confirmed or completed
  if (appointment.status !== "confirmed" && appointment.status !== "completed") {
    return { success: false, message: "Só é possível avaliar sessões confirmadas ou concluídas." }
  }

  // 4. Check if already evaluated
  const { data: existingFeedback } = await client
    .from("appointment_feedbacks")
    .select("id")
    .eq("appointment_id", input.appointmentId)
    .eq("reviewer_id", userId)
    .maybeSingle()

  if (existingFeedback) {
    return { success: false, message: "Esta mentoria já foi avaliada anteriormente." }
  }

  // 5. Insert into appointment_feedbacks
  const { error: feedbackError } = await client.from("appointment_feedbacks").insert({
    appointment_id: input.appointmentId,
    reviewer_id: userId,
    reviewed_id: appointment.mentor_id,
    rating: input.rating,
    private_notes: input.privateNotes || null,
    public_feedback: input.publicFeedback || null
  })

  if (feedbackError) {
    console.error("Erro ao registrar avaliação da mentoria:", feedbackError)
    return { success: false, message: "Erro ao registrar avaliação da mentoria." }
  }

  // 6. Also record in feedback table with source 'session' (AI_PLATFORM_PLAN §4.3)
  try {
    await client.from("feedback").insert({
      user_id: userId,
      rating: input.rating,
      comment: input.publicFeedback || input.privateNotes || null,
      source: "session",
      context: {
        appointment_id: input.appointmentId,
        mentor_id: appointment.mentor_id
      },
      page_url: "/assistant"
    })
  } catch (err) {
    console.error("Erro ao registrar feedback geral da sessão:", err)
  }

  // 7. Update appointment status to completed
  try {
    const { error: updateError } = await client
      .from("appointments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", input.appointmentId)

    if (updateError) {
      console.error("Erro ao marcar agendamento como completed:", updateError)
    }
  } catch (err) {
    console.error("Erro inesperado ao marcar agendamento como completed:", err)
  }

  return {
    success: true,
    message: "Avaliação registrada com sucesso! Agradecemos por compartilhar sua experiência sobre a mentoria."
  }
}

// --- Registro único ---
export const assistantTools = {
  searchMentors,
  getMentorAvailability,
  explainHowItWorks,
  saveFeedback,
  getMyAppointments,
  getPendingEvaluations,
  getMentorRequests,
  evaluateMentorshipSession
}
