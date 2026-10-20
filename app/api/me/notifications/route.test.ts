/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

const completedAppointment = {
  id: "a1",
  mentor_id: "other",
  mentee_id: "u1",
  scheduled_at: "2026-10-10T12:00:00.000Z",
  status: "completed",
  notes_mentor: null,
  created_at: "2026-10-01T12:00:00.000Z",
  updated_at: "2026-10-10T13:00:00.000Z",
  mentor: { full_name: "Marta" },
  mentee: { full_name: "Ana" },
}

function mockSession(
  user: { id: string } | null,
  tables: { appointments?: { data: unknown; error: unknown }; appointment_feedbacks?: { data: unknown; error: unknown } } = {}
) {
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    from: (table: "appointments" | "appointment_feedbacks") => {
      const result = tables[table] ?? { data: [], error: null }
      const query = {
        select: () => query,
        or: () => query,
        order: () => query,
        eq: () => query,
        limit: async () => result,
        then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
      }
      return query
    },
  }
  ;(createClient as jest.Mock).mockResolvedValue(client)
}

const get = (qs = "") => GET(new NextRequest(`http://localhost:3000/api/me/notifications${qs}`))

describe("GET /api/me/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("returns 401 without a session", async () => {
    mockSession(null)
    const res = await get()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Não autenticado" })
  })

  it("returns the derived notifications under the same key", async () => {
    mockSession({ id: "u1" }, { appointments: { data: [completedAppointment], error: null } })
    const res = await get("?role=mentee")
    expect(res.status).toBe(200)
    const { notifications } = await res.json()
    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toMatchObject({
      id: "pending-evaluation-a1",
      type: "pending_evaluation",
      actionUrl: "/mentorship/mentee#action",
    })
  })

  it("does not ask for a review that was already left", async () => {
    mockSession(
      { id: "u1" },
      {
        appointments: { data: [completedAppointment], error: null },
        appointment_feedbacks: { data: [{ appointment_id: "a1" }], error: null },
      }
    )
    expect((await (await get("?role=mentee")).json()).notifications).toEqual([])
  })

  it("keeps answering 200 with an empty list when the database fails", async () => {
    mockSession({ id: "u1" }, { appointments: { data: null, error: { message: "boom" } } })
    const res = await get()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ notifications: [] })
  })

  it("an unknown role such as admin yields no notifications", async () => {
    mockSession({ id: "u1" }, { appointments: { data: [completedAppointment], error: null } })
    expect((await (await get("?role=admin")).json()).notifications).toEqual([])
  })
})
