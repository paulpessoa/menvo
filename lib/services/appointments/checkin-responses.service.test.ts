import { answerCheckin, findPendingMenteeCheckin, getCheckin } from "./checkin-responses.service"

const NOW = new Date("2026-10-20T12:00:00.000Z")
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()
const VALID_TOKEN = "a".repeat(43)

function dbReturning(rows: unknown[] | null, rpcData: unknown = null) {
  const query: any = {}
  for (const method of ["select", "eq", "gte", "lte", "order"]) query[method] = jest.fn(() => query)
  query.then = (resolve: (v: unknown) => void) => resolve({ data: rows, error: null })
  return {
    from: jest.fn(() => query),
    rpc: jest.fn().mockResolvedValue({ data: rpcData, error: null })
  } as any
}

function session(id: string, startedHoursAgo: number, checkins: { role: string; outcome: string | null }[] = []) {
  return {
    id,
    scheduled_at: hoursAgo(startedHoursAgo),
    duration_minutes: 45,
    mentor: { full_name: "Marta Mentora" },
    appointment_checkins: checkins
  }
}

describe("findPendingMenteeCheckin", () => {
  it("devolve a sessão mais antiga sem resposta do mentorado", async () => {
    const db = dbReturning([session("old", 48), session("newer", 24)])
    await expect(findPendingMenteeCheckin(db, "mentee-1", NOW)).resolves.toEqual({
      appointmentId: "old",
      scheduledAt: hoursAgo(48),
      mentorName: "Marta Mentora"
    })
  })

  it("ignora sessões que o mentorado já respondeu, mesmo que o mentor não", async () => {
    const db = dbReturning([
      session("answered", 48, [{ role: "mentee", outcome: "happened" }]),
      session("mentor-only", 30, [{ role: "mentor", outcome: "happened" }])
    ])
    await expect(findPendingMenteeCheckin(db, "mentee-1", NOW)).resolves.toMatchObject({ appointmentId: "mentor-only" })
  })

  it("não bloqueia enquanto não passaram 2h do fim da sessão", async () => {
    const db = dbReturning([session("just-ended", 2)])
    await expect(findPendingMenteeCheckin(db, "mentee-1", NOW)).resolves.toBeNull()
  })

  it("não bloqueia quando a consulta falha", async () => {
    await expect(findPendingMenteeCheckin(dbReturning(null), "mentee-1", NOW)).resolves.toBeNull()
  })
})

describe("token checks", () => {
  it("recusa token malformado sem chamar o banco", async () => {
    const db = dbReturning([])
    await expect(getCheckin(db, "curto")).resolves.toEqual({ ok: false, error: "invalid_token" })
    await expect(answerCheckin(db, "../../etc", "happened")).resolves.toEqual({ ok: false, error: "invalid_token" })
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it("repassa o erro do banco sem inventar dados", async () => {
    const db = dbReturning([], { error: "invalid_token" })
    await expect(getCheckin(db, VALID_TOKEN)).resolves.toEqual({ ok: false, error: "invalid_token" })
  })

  it("valida o resumo devolvido pelo banco", async () => {
    const summary = {
      appointment_id: "11111111-1111-4111-8111-111111111111",
      role: "mentee",
      outcome: null,
      scheduled_at: hoursAgo(20),
      other_first_name: "Marta",
      mentor_slug: "marta",
      can_add_details: null
    }
    const result = await getCheckin(dbReturning([], summary), VALID_TOKEN)
    expect(result).toEqual({ ok: true, data: { ...summary, can_add_details: false } })
  })
})
