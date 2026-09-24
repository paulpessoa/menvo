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
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: "apt-done-1",
                  scheduled_at: "2026-09-20T10:00:00Z",
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

