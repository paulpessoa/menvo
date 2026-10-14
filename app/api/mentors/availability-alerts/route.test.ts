/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildAvailabilityAlertService } from "@/lib/services/mentors/availability-alert.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/mentors/availability-alert.composition", () => ({
  buildAvailabilityAlertService: jest.fn(),
}))

const MENTOR_ID = "11111111-1111-4111-8111-111111111111"
const service = { hasActiveAlert: jest.fn(), subscribe: jest.fn(), notifySubscribers: jest.fn() }
const getUser = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser } })
  ;(buildAvailabilityAlertService as jest.Mock).mockReturnValue(service)
})

describe("GET /api/mentors/availability-alerts", () => {
  it("returns 400 for invalid mentor_id", async () => {
    const res = await GET(new NextRequest("http://localhost/api/mentors/availability-alerts?mentor_id=invalid"))
    expect(res.status).toBe(400)
  })

  it("returns hasActiveAlert: false when not logged in", async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(new NextRequest(`http://localhost/api/mentors/availability-alerts?mentor_id=${MENTOR_ID}`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, hasActiveAlert: false })
  })

  it("checks alert status for logged in user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    service.hasActiveAlert.mockResolvedValue(true)

    const res = await GET(new NextRequest(`http://localhost/api/mentors/availability-alerts?mentor_id=${MENTOR_ID}`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, hasActiveAlert: true })
    expect(service.hasActiveAlert).toHaveBeenCalledWith(MENTOR_ID, "user-1")
  })
})

describe("POST /api/mentors/availability-alerts", () => {
  it("subscribes logged in user using profile email", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com" } } })
    service.subscribe.mockResolvedValue({ kind: "subscribed", alert: { id: "a1" } })

    const res = await POST(
      new NextRequest("http://localhost/api/mentors/availability-alerts", {
        method: "POST",
        body: JSON.stringify({ mentor_id: MENTOR_ID }),
      })
    )

    expect(res.status).toBe(200)
    expect(service.subscribe).toHaveBeenCalledWith({
      mentor_id: MENTOR_ID,
      mentee_id: "user-1",
      email: "user@example.com",
    })
  })

  it("subscribes unauthenticated visitor with provided email", async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    service.subscribe.mockResolvedValue({ kind: "subscribed", alert: { id: "a2" } })

    const res = await POST(
      new NextRequest("http://localhost/api/mentors/availability-alerts", {
        method: "POST",
        body: JSON.stringify({ mentor_id: MENTOR_ID, email: "guest@example.com" }),
      })
    )

    expect(res.status).toBe(200)
    expect(service.subscribe).toHaveBeenCalledWith({
      mentor_id: MENTOR_ID,
      mentee_id: null,
      email: "guest@example.com",
    })
  })

  it("returns 400 when visitor does not provide email", async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const res = await POST(
      new NextRequest("http://localhost/api/mentors/availability-alerts", {
        method: "POST",
        body: JSON.stringify({ mentor_id: MENTOR_ID }),
      })
    )

    expect(res.status).toBe(400)
  })
})
