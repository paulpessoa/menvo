/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

const MENTOR = "6f1c2a4e-1b2c-4d3e-9f00-0123456789ab"

/** Cliente falso: `user_favorites` com leitura, insert e delete. */
function mockSession(user: { id: string } | null, db: { list?: unknown; write?: { message: string } | null } = {}) {
  const calls = { insert: [] as unknown[], deleteEq: [] as unknown[][] }
  const result = { data: db.list ?? [], error: null }
  const writeResult = { error: db.write ?? null }
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => ({
      select: () => ({ eq: async () => result }),
      insert: async (row: unknown) => {
        calls.insert.push(row)
        return writeResult
      },
      delete: () => ({
        eq: (...a: unknown[]) => {
          calls.deleteEq.push(a)
          return { eq: async (...b: unknown[]) => (calls.deleteEq.push(b), writeResult) }
        },
      }),
    }),
  }
  ;(createClient as jest.Mock).mockResolvedValue(client)
  return calls
}

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost:3000/api/me/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  )

describe("/api/me/favorites", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("GET returns 401 without a session", async () => {
    mockSession(null)
    const res = await GET()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Não autenticado" })
  })

  it("GET returns the favorite ids in the same shape as before", async () => {
    mockSession({ id: "u1" }, { list: [{ mentor_id: "m1" }, { mentor_id: "m2" }] })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ favorites: ["m1", "m2"] })
  })

  it("POST returns 401 without a session", async () => {
    mockSession(null)
    expect((await post({ mentorId: MENTOR, action: "add" })).status).toBe(401)
  })

  it.each([["not json"], [{ mentorId: "x", action: "add" }], [{ mentorId: MENTOR, action: "toggle" }], [{}]])(
    "POST rejects %j with 400",
    async body => {
      mockSession({ id: "u1" })
      const res = await post(body)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: "Dados inválidos" })
    }
  )

  it("POST add inserts a row for the session user, ignoring any user id in the body", async () => {
    const calls = mockSession({ id: "u1" })
    const res = await post({ mentorId: MENTOR, action: "add", user_id: "someone-else" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(calls.insert).toEqual([{ user_id: "u1", mentor_id: MENTOR }])
  })

  it("POST remove deletes by session user and mentor", async () => {
    const calls = mockSession({ id: "u1" })
    const res = await post({ mentorId: MENTOR, action: "remove" })
    expect(res.status).toBe(200)
    expect(calls.deleteEq).toEqual([["user_id", "u1"], ["mentor_id", MENTOR]])
  })

  it("POST answers 500 with the same message when the write fails", async () => {
    mockSession({ id: "u1" }, { write: { message: "duplicate key" } })
    const res = await post({ mentorId: MENTOR, action: "add" })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Não foi possível atualizar os favoritos" })
  })
})
