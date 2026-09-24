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

// --- Registro único ---
export const assistantTools = { searchMentors, getMentorAvailability, explainHowItWorks, saveFeedback }
