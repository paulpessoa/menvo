/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildMentorAvailabilityService } from "@/lib/services/mentors/mentor-availability.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/mentors/mentor-availability.composition", () => ({
  buildMentorAvailabilityService: jest.fn(),
}))

const MENTOR = "11111111-1111-4111-8111-111111111111"
const slot = {
  id: "s1",
  mentor_id: MENTOR,
  day_of_week: 1,
  start_time: "09:00:00",
  end_time: "09:45:00",
  timezone: "America/Sao_Paulo",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
}

const service = { list: jest.fn(), saveOwn: jest.fn() }
const getUser = jest.fn()

function loggedAs(id: string | null) {
  getUser.mockResolvedValue({ data: { user: id ? { id } : null }, error: null })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser } })
  ;(buildMentorAvailabilityService as jest.Mock).mockReturnValue(service)
})

describe("GET /api/mentors/availability", () => {
  it("401 without mentor_id when nobody is logged in", async () => {
    loggedAs(null)
    const res = await GET(new NextRequest("http://localhost/api/mentors/availability"))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Não autenticado" })
  })

  it("returns the logged-in mentor's own schedule when mentor_id is omitted", async () => {
    loggedAs(MENTOR)
    service.list.mockResolvedValue({ kind: "ok", slots: [slot] })
    const res = await GET(new NextRequest("http://localhost/api/mentors/availability"))
    expect(res.status).toBe(200)
    expect(service.list).toHaveBeenCalledWith(MENTOR)
    expect(await res.json()).toEqual({ success: true, data: [slot] })
  })

  it("reads another mentor's schedule by id without requiring a session", async () => {
    service.list.mockResolvedValue({ kind: "ok", slots: [] })
    const res = await GET(new NextRequest(`http://localhost/api/mentors/availability?mentor_id=${MENTOR}`))
    expect(res.status).toBe(200)
    expect(getUser).not.toHaveBeenCalled()
    expect(service.list).toHaveBeenCalledWith(MENTOR)
  })

  it("400 for a mentor_id that is not a uuid, before touching the database", async () => {
    const res = await GET(new NextRequest("http://localhost/api/mentors/availability?mentor_id=abc"))
    expect(res.status).toBe(400)
    expect(service.list).not.toHaveBeenCalled()
  })

  it("500 when the service fails", async () => {
    service.list.mockResolvedValue({ kind: "failed" })
    const res = await GET(new NextRequest(`http://localhost/api/mentors/availability?mentor_id=${MENTOR}`))
    expect(res.status).toBe(500)
  })
})

describe("POST /api/mentors/availability", () => {
  const post = (body: unknown) =>
    POST(
      new NextRequest("http://localhost/api/mentors/availability", {
        method: "POST",
        body: JSON.stringify(body),
      })
    )

  it("401 when nobody is logged in", async () => {
    loggedAs(null)
    const res = await post({ slots: [] })
    expect(res.status).toBe(401)
    expect(service.saveOwn).not.toHaveBeenCalled()
  })

  it("400 with Zod details for a malformed body", async () => {
    loggedAs(MENTOR)
    const res = await post({ slots: [{ day_of_week: 9, start_time: "09:00", end_time: "10:00" }] })
    expect(res.status).toBe(400)
    expect((await res.json()).details).toBeDefined()
  })

  it("400 INVALID_RANGE when a slot ends before it starts", async () => {
    loggedAs(MENTOR)
    service.saveOwn.mockResolvedValue({ kind: "invalid_range", dayOfWeek: 1 })
    const res = await post({ slots: [{ day_of_week: 1, start_time: "10:00", end_time: "09:00" }] })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_RANGE")
  })

  it("saves and returns the stored slots with the same response shape as before", async () => {
    loggedAs(MENTOR)
    service.saveOwn.mockResolvedValue({ kind: "saved", slots: [slot] })
    const res = await post({ slots: [{ day_of_week: 1, start_time: "09:00", end_time: "09:45" }], timezone: "America/Recife" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: [slot], message: "Disponibilidade salva com sucesso" })
    expect(service.saveOwn).toHaveBeenCalledWith(expect.objectContaining({ timezone: "America/Recife" }))
  })

  it("500 when the service fails", async () => {
    loggedAs(MENTOR)
    service.saveOwn.mockResolvedValue({ kind: "failed" })
    const res = await post({ slots: [] })
    expect(res.status).toBe(500)
  })
})
