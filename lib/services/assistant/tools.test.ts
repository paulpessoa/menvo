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
