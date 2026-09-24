import type { SupabaseClient } from "@supabase/supabase-js"
import { searchMentors } from "./tools"
import { mentorService } from "@/lib/services/mentors/mentors.service"

jest.mock("@/lib/services/mentors/mentors.service", () => ({
  mentorService: { searchCatalog: jest.fn() }
}))
jest.mock("@/lib/services/mentors/mentor-public.service", () => ({ mentorPublicService: {} }))
jest.mock("@/lib/services/appointments/availability.service", () => ({ computeAvailableSlots: jest.fn() }))

const searchCatalog = mentorService.searchCatalog as jest.Mock

const row = {
  id: "m1",
  full_name: "Ana Souza",
  avatar_url: null,
  bio: "x".repeat(500),
  job_title: "Data Scientist",
  company: "Acme",
  city: "Recife",
  state: "PE",
  country: "Brasil",
  languages: ["pt"],
  mentorship_topics: ["carreira", "entrevistas", "dados"],
  inclusive_tags: null,
  expertise_areas: ["python", "sql", "dados", "ml"],
  availability_status: "available",
  average_rating: 4.8,
  total_reviews: 3,
  total_sessions: 5,
  experience_years: 8,
  slug: "ana-souza",
  created_at: "2026-01-01",
  email: "ana@example.com",
  phone: "+5581999999999"
}

describe("searchMentors", () => {
  beforeEach(() => searchCatalog.mockReset())

  it("sends only the lean DTO to the model", async () => {
    searchCatalog.mockResolvedValue({ data: [row], count: 1 })
    const { forLlm } = await searchMentors({} as SupabaseClient, { query: "dados", limit: 3 })

    expect(forLlm).toHaveLength(1)
    expect(Object.keys(forLlm[0]).sort()).toEqual(["bio", "name", "profileUrl", "role", "skills", "slug"])
    expect(forLlm[0].bio).toHaveLength(200)
    expect(forLlm[0].skills).toEqual(["python", "sql", "dados", "ml", "carreira"])
    expect(forLlm[0].profileUrl).toMatch(/\/mentors\/ana-souza$/)
    expect(JSON.stringify(forLlm)).not.toMatch(/example\.com|9999/)
  })

  it("strips fields outside the card DTO and drops malformed rows", async () => {
    searchCatalog.mockResolvedValue({ data: [row, { ...row, id: "m2", average_rating: "bad" }], count: 2 })
    const { forCard } = await searchMentors({} as SupabaseClient, { query: "dados", limit: 3 })

    expect(forCard).toHaveLength(1)
    expect(forCard[0]).not.toHaveProperty("email")
    expect(forCard[0]).not.toHaveProperty("phone")
    expect(forCard[0]).not.toHaveProperty("created_at")
  })

  it("asks for the first catalog page (0-indexed)", async () => {
    searchCatalog.mockResolvedValue({ data: [], count: 0 })
    await searchMentors({} as SupabaseClient, { query: "dados", limit: 3 })
    expect(searchCatalog).toHaveBeenCalledWith(expect.objectContaining({ page: 0, limit: 3 }))
  })
})

describe("getMyAppointments", () => {
  it("formats user appointments and identifies partner correctly", async () => {
    const { getMyAppointments } = await import("./tools")
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: "apt-1",
            status: "confirmed",
            scheduled_at: "2026-10-15T14:00:00Z",
            google_meet_link: "https://meet.google.com/abc",
            meeting_link: null,
            mentor_id: "u1",
            mentee_id: "u2",
            mentor: { full_name: "Eu Mentor", job_title: "Staff" },
            mentee: { full_name: "Aluno João", job_title: "Dev Jr" }
          }
        ]
      })
    } as unknown as SupabaseClient

    const result = await getMyAppointments(mockSupabase, "u1", { limit: 5 })
    expect(result).toHaveLength(1)
    expect(result[0].partnerName).toBe("Aluno João")
    expect(result[0].status).toBe("confirmed")
    expect(result[0].meetLink).toBe("https://meet.google.com/abc")
  })
})

describe("getPendingEvaluations", () => {
  it("strictly enforces invariant #2: mentors never evaluate mentees", async () => {
    const { getPendingEvaluations } = await import("./tools")
    const result = await getPendingEvaluations({} as SupabaseClient, "mentor-1", "mentor")
    expect(result).toEqual({ message: "Mentores não avaliam mentorados na plataforma Menvo." })
  })

  it("returns unreviewed completed appointments for mentee", async () => {
    const { getPendingEvaluations } = await import("./tools")
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: "apt-done-1",
                  scheduled_at: "2026-09-20T10:00:00Z",
                  status: "completed",
                  mentor: { full_name: "Mentor Incrível", job_title: "Tech Lead" }
                }
              ]
            })
          }
        }
        if (table === "appointment_feedbacks") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [] // no feedback submitted yet
            })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient

    const result = await getPendingEvaluations(mockSupabase as any, "mentee-1", "mentee")
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect((result as any)[0].mentorName).toBe("Mentor Incrível")
  })
})

describe("getMentorRequests", () => {
  it("blocks non-mentors from accessing mentor requests", async () => {
    const { getMentorRequests } = await import("./tools")
    const result = await getMentorRequests({} as SupabaseClient, "mentee-1", "mentee")
    expect(result).toEqual({ message: "Apenas mentores podem visualizar solicitações de mentoria." })
  })

  it("returns pending requests for mentors", async () => {
    const { getMentorRequests } = await import("./tools")
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: "req-1",
            scheduled_at: "2026-09-28T18:00:00Z",
            mentee: { full_name: "Dev Aspirante", job_title: "Estudante" }
          }
        ]
      })
    } as unknown as SupabaseClient

    const result = await getMentorRequests(mockSupabase, "mentor-1", "mentor")
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect((result as any)[0].menteeName).toBe("Dev Aspirante")
  })
})

describe("evaluateMentorshipSession", () => {
  it("strictly enforces invariant #2: rejects evaluation if user is not the mentee", async () => {
    const { evaluateMentorshipSession } = await import("./tools")
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "33333333-3333-3333-3333-333333333333",
          mentor_id: "user-mentor",
          mentee_id: "other-user",
          status: "completed"
        },
        error: null
      })
    } as unknown as SupabaseClient

    const result = await evaluateMentorshipSession(mockSupabase, "current-user", {
      appointmentId: "33333333-3333-3333-3333-333333333333",
      rating: 5
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain("Apenas o mentorado participante pode avaliar")
  })

  it("rejects non-existent appointments", async () => {
    const { evaluateMentorshipSession } = await import("./tools")
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } })
    } as unknown as SupabaseClient

    const result = await evaluateMentorshipSession(mockSupabase, "mentee-1", {
      appointmentId: "33333333-3333-3333-3333-333333333333",
      rating: 5
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain("Agendamento de mentoria não encontrado")
  })

  it("rejects sessions that are not confirmed or completed", async () => {
    const { evaluateMentorshipSession } = await import("./tools")
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "33333333-3333-3333-3333-333333333333",
          mentor_id: "mentor-1",
          mentee_id: "mentee-1",
          status: "cancelled"
        },
        error: null
      })
    } as unknown as SupabaseClient

    const result = await evaluateMentorshipSession(mockSupabase, "mentee-1", {
      appointmentId: "33333333-3333-3333-3333-333333333333",
      rating: 5
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain("Só é possível avaliar sessões confirmadas ou concluídas")
  })

  it("prevents duplicate evaluations", async () => {
    const { evaluateMentorshipSession } = await import("./tools")
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "33333333-3333-3333-3333-333333333333",
                mentor_id: "mentor-1",
                mentee_id: "mentee-1",
                status: "completed"
              },
              error: null
            })
          }
        }
        if (table === "appointment_feedbacks") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "fb-1" }
            })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient

    const result = await evaluateMentorshipSession(mockSupabase, "mentee-1", {
      appointmentId: "33333333-3333-3333-3333-333333333333",
      rating: 5
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain("Esta mentoria já foi avaliada anteriormente")
  })

  it("successfully records feedback and marks appointment completed", async () => {
    const { evaluateMentorshipSession } = await import("./tools")
    const insertFeedbackMock = jest.fn().mockResolvedValue({ error: null })
    const insertGeneralFeedbackMock = jest.fn().mockReturnValue(Promise.resolve({ error: null }))
    const updateAppointmentMock = jest.fn().mockReturnValue(Promise.resolve({ error: null }))

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "33333333-3333-3333-3333-333333333333",
                mentor_id: "mentor-1",
                mentee_id: "mentee-1",
                status: "confirmed"
              },
              error: null
            }),
            update: jest.fn().mockReturnValue({
              eq: updateAppointmentMock
            })
          }
        }
        if (table === "appointment_feedbacks") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: insertFeedbackMock
          }
        }
        if (table === "feedback") {
          return {
            insert: insertGeneralFeedbackMock
          }
        }
        return {}
      })
    } as unknown as SupabaseClient

    const result = await evaluateMentorshipSession(mockSupabase, "mentee-1", {
      appointmentId: "33333333-3333-3333-3333-333333333333",
      rating: 5,
      publicFeedback: "Excelente mentor!",
      privateNotes: "Muito pontual."
    })

    expect(result.success).toBe(true)
    expect(insertFeedbackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: "33333333-3333-3333-3333-333333333333",
        reviewer_id: "mentee-1",
        reviewed_id: "mentor-1",
        rating: 5,
        public_feedback: "Excelente mentor!",
        private_notes: "Muito pontual."
      })
    )
    expect(insertGeneralFeedbackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "mentee-1",
        rating: 5,
        comment: "Excelente mentor!",
        source: "session"
      })
    )
  })
})

describe("saveFeedback", () => {
  it("persists feedback with source and context", async () => {
    const { saveFeedback } = await import("./tools")
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } } })
      },
      from: jest.fn().mockReturnValue({
        insert: insertMock
      })
    } as unknown as SupabaseClient

    const result = await saveFeedback(mockSupabase, {
      rating: 5,
      comment: "Adorei o atendimento!",
      source: "diagnostic",
      context: { session_id: "diag-123" }
    })

    expect(result.success).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        rating: 5,
        comment: "Adorei o atendimento!",
        source: "diagnostic",
        context: { session_id: "diag-123" },
        page_url: "/assistant?mode=diagnostic"
      })
    )
  })
})

describe("searchKnowledgeBase", () => {
  it("returns matched articles with titles, summaries and links", async () => {
    const { searchKnowledgeBase } = await import("./tools")
    const result = searchKnowledgeBase({ query: "como funciona" }, "mentee")
    expect(result.found).toBe(true)
    expect(result.articles.length).toBeGreaterThan(0)
    expect(result.articles[0]).toHaveProperty("title")
    expect(result.articles[0]).toHaveProperty("summary")
    expect(result.articles[0]).toHaveProperty("content")
    expect(result.articles[0]).toHaveProperty("links")
  })

  it("handles empty results gracefully", async () => {
    const { searchKnowledgeBase } = await import("./tools")
    const result = searchKnowledgeBase({ query: "xyz123termonaoexistente" }, "mentee")
    expect(result.found).toBe(false)
    expect(result.articles).toEqual([])
    expect(result.message).toContain("Nenhum artigo específico encontrado")
  })
})



