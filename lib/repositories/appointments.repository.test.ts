/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createAppointmentsRepository } from "./appointments.repository"
import { RepositoryError } from "./repository-error"

const ID = "11111111-1111-4111-8111-111111111111"
const MENTOR = "22222222-2222-4222-8222-222222222222"
const MENTEE = "33333333-3333-4333-8333-333333333333"
const NOW = new Date("2026-10-20T12:00:00.000Z")

/** Thenable query builder: every call returns itself and is recorded; awaiting yields `result`. */
function builder(result: unknown) {
  const calls: Record<string, unknown[][]> = {}
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") return (resolve: (v: unknown) => unknown) => resolve(result)
        return (...args: unknown[]) => {
          ;(calls[prop] ||= []).push(args)
          return proxy
        }
      },
    }
  )
  return { proxy, calls }
}

function repoWith(result: unknown) {
  const q = builder(result)
  const db = { from: jest.fn(() => q.proxy) } as unknown as SupabaseClient<Database>
  return { repo: createAppointmentsRepository(db, () => NOW), db, calls: q.calls }
}

const row = (over: Record<string, unknown> = {}) => ({
  id: ID,
  mentor_id: MENTOR,
  mentee_id: MENTEE,
  scheduled_at: "2026-10-25T15:00:00.000Z",
  duration_minutes: 45,
  status: "pending",
  ...over,
})

const party = (id: string, name: string) => ({ id, full_name: name, email: `${name}@x.co`, avatar_url: null, linkedin_url: null })

describe("find*", () => {
  it("findById reads by id and narrows the status", async () => {
    const { repo, db, calls } = repoWith({ data: row(), error: null })
    const found = await repo.findById(ID)
    expect(db.from).toHaveBeenCalledWith("appointments")
    expect(calls.eq).toEqual([["id", ID]])
    expect(found?.status).toBe("pending")
  })

  it("returns null when there is no row", async () => {
    expect(await repoWith({ data: null, error: null }).repo.findById(ID)).toBeNull()
  })

  it("treats an invalid UUID (22P02) as not found, like the routes did", async () => {
    const { repo } = repoWith({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } })
    expect(await repo.findById("123")).toBeNull()
  })

  it("wraps any other error in RepositoryError without the driver object", async () => {
    const { repo } = repoWith({ data: null, error: { code: "XX000", message: "boom" } })
    await expect(repo.findById(ID)).rejects.toThrow(RepositoryError)
    await expect(repo.findById(ID)).rejects.toThrow("appointments.findById: boom")
  })

  it("refuses a status the database should never hold", async () => {
    const { repo } = repoWith({ data: row({ status: "rejected" }), error: null })
    await expect(repo.findById(ID)).rejects.toThrow(/status desconhecido: rejected/)
  })

  it("findByActionToken filters by the token column", async () => {
    const { repo, calls } = repoWith({ data: row(), error: null })
    await repo.findByActionToken("tok")
    expect(calls.eq).toEqual([["action_token", "tok"]])
  })

  it("findWithParties embeds both profiles in one query and accepts object or list embeds", async () => {
    const { repo, calls } = repoWith({
      data: row({ mentor: party(MENTOR, "ana"), mentee: [party(MENTEE, "bia")] }),
      error: null,
    })
    const found = await repo.findWithParties(ID)
    expect(String(calls.select[0][0])).toContain("mentor:profiles!mentor_id(")
    expect(String(calls.select[0][0])).toContain("mentee:profiles!mentee_id(")
    expect(found?.mentor?.full_name).toBe("ana")
    expect(found?.mentee?.full_name).toBe("bia")
  })
})

describe("listForUser", () => {
  const data = [row({ mentor: party(MENTOR, "ana"), mentee: party(MENTEE, "bia"), feedbacks: [{ id: "f1", reviewer_id: MENTEE }] })]

  it("filters by the mentor column for role=mentor", async () => {
    const { repo, calls } = repoWith({ data, error: null })
    const items = await repo.listForUser({ userId: MENTOR, role: "mentor", limit: 10 })
    expect(calls.eq).toEqual([["mentor_id", MENTOR]])
    expect(calls.limit).toEqual([[10]])
    expect(items[0].feedbacks).toEqual([{ id: "f1", reviewer_id: MENTEE }])
    expect(String(calls.select[0][0])).toContain("feedbacks:appointment_feedbacks(id, reviewer_id)")
  })

  it("filters by the mentee column for role=mentee and adds the status filter", async () => {
    const { repo, calls } = repoWith({ data, error: null })
    await repo.listForUser({ userId: MENTEE, role: "mentee", status: "confirmed", limit: 5 })
    expect(calls.eq).toEqual([["mentee_id", MENTEE], ["status", "confirmed"]])
  })

  it("matches either side without a role", async () => {
    const { repo, calls } = repoWith({ data, error: null })
    await repo.listForUser({ userId: MENTOR, limit: 10 })
    expect(calls.or).toEqual([[`mentor_id.eq.${MENTOR},mentee_id.eq.${MENTOR}`]])
  })

  it("refuses a userId that is not a UUID before building the .or filter", async () => {
    const { repo, db } = repoWith({ data, error: null })
    await expect(repo.listForUser({ userId: "x,mentor_id.not.is.null", limit: 10 })).rejects.toThrow(RepositoryError)
    expect(db.from).not.toHaveBeenCalled()
  })

  it("defaults a missing feedbacks embed to an empty list", async () => {
    const { repo } = repoWith({ data: [row()], error: null })
    const [item] = await repo.listForUser({ userId: MENTOR, role: "mentor", limit: 10 })
    expect(item.feedbacks).toEqual([])
    expect(item.mentor).toBeNull()
  })
})

describe("hasSlotConflict and listBusyIntervals", () => {
  it("looks only at pending and confirmed requests of that mentor and time", async () => {
    const { repo, calls } = repoWith({ data: [{ id: ID }], error: null })
    expect(await repo.hasSlotConflict(MENTOR, "2026-10-25T15:00:00.000Z")).toBe(true)
    expect(calls.eq).toEqual([["mentor_id", MENTOR], ["scheduled_at", "2026-10-25T15:00:00.000Z"]])
    expect(calls.in).toEqual([["status", ["pending", "confirmed"]]])
  })

  it("reports no conflict on an empty result", async () => {
    expect(await repoWith({ data: [], error: null }).repo.hasSlotConflict(MENTOR, "2026-10-25T15:00:00.000Z")).toBe(false)
  })

  it("listBusyIntervals bounds the range and selects only time columns", async () => {
    const busy = [{ scheduled_at: "2026-10-25T15:00:00.000Z", duration_minutes: 45 }]
    const { repo, calls } = repoWith({ data: busy, error: null })
    const from = new Date("2026-10-20T00:00:00.000Z")
    const to = new Date("2026-11-03T00:00:00.000Z")
    expect(await repo.listBusyIntervals(MENTOR, from, to)).toEqual(busy)
    expect(calls.select).toEqual([["scheduled_at, duration_minutes"]])
    expect(calls.gte).toEqual([["scheduled_at", from.toISOString()]])
    expect(calls.lte).toEqual([["scheduled_at", to.toISOString()]])
  })
})

describe("insertPending", () => {
  it("always inserts status pending, whatever the caller passes", async () => {
    const { repo, calls } = repoWith({ data: row({ mentor: party(MENTOR, "ana"), mentee: party(MENTEE, "bia") }), error: null })
    const created = await repo.insertPending({
      mentor_id: MENTOR,
      mentee_id: MENTEE,
      scheduled_at: "2026-10-25T15:00:00.000Z",
      action_token: "tok",
    })
    expect(calls.insert[0][0]).toMatchObject({ mentor_id: MENTOR, action_token: "tok", status: "pending" })
    expect(created.mentee?.full_name).toBe("bia")
  })

  it("wraps an insert error", async () => {
    const { repo } = repoWith({ data: null, error: { message: "duplicate" } })
    await expect(
      repo.insertPending({ mentor_id: MENTOR, mentee_id: MENTEE, scheduled_at: "2026-10-25T15:00:00.000Z" })
    ).rejects.toThrow("appointments.insertPending: duplicate")
  })
})

describe("transitionStatus", () => {
  it("updates conditionally on the current status and stamps updated_at", async () => {
    const { repo, calls } = repoWith({ data: [row({ status: "cancelled" })], error: null })
    const result = await repo.transitionStatus({
      id: ID,
      from: ["pending", "confirmed"],
      to: "cancelled",
      patch: { cancellation_reason: "motivo", cancelled_by: MENTOR },
    })
    expect(calls.update[0][0]).toEqual({
      cancellation_reason: "motivo",
      cancelled_by: MENTOR,
      status: "cancelled",
      updated_at: NOW.toISOString(),
    })
    expect(calls.eq).toEqual([["id", ID]])
    expect(calls.in).toEqual([["status", ["pending", "confirmed"]]])
    expect(result?.status).toBe("cancelled")
  })

  it("accepts a single from status", async () => {
    const { repo, calls } = repoWith({ data: [row({ status: "completed" })], error: null })
    await repo.transitionStatus({ id: ID, from: "confirmed", to: "completed" })
    expect(calls.in).toEqual([["status", ["confirmed"]]])
  })

  it("returns null when the status had already changed (lost the race)", async () => {
    const { repo } = repoWith({ data: [], error: null })
    expect(await repo.transitionStatus({ id: ID, from: "pending", to: "confirmed" })).toBeNull()
  })

  it("cannot be tricked by a patch: status in the patch is overridden by `to`", async () => {
    const { repo, calls } = repoWith({ data: [row({ status: "confirmed" })], error: null })
    await repo.transitionStatus({ id: ID, from: "pending", to: "confirmed", patch: { notes_mentor: "ok" } })
    expect((calls.update[0][0] as { status: string }).status).toBe("confirmed")
  })

  it("wraps database errors", async () => {
    const { repo } = repoWith({ data: null, error: { message: "appointment_invalid_transition: cancelled -> completed" } })
    await expect(repo.transitionStatus({ id: ID, from: "confirmed", to: "completed" })).rejects.toThrow(
      /appointment_invalid_transition/
    )
  })
})

describe("setFields and renewActionToken", () => {
  it("setFields updates the given columns without touching status", async () => {
    const { repo, calls } = repoWith({ error: null })
    await repo.setFields(ID, { pending_reminder_sent_at: NOW.toISOString() })
    expect(calls.update[0][0]).toEqual({ pending_reminder_sent_at: NOW.toISOString(), updated_at: NOW.toISOString() })
    expect(calls.update[0][0]).not.toHaveProperty("status")
  })

  it("renewActionToken only renews a request that is still pending", async () => {
    const { repo, calls } = repoWith({ data: [{ id: ID }], error: null })
    expect(await repo.renewActionToken(ID, "new", "2026-10-27T12:00:00.000Z")).toBe(true)
    expect(calls.eq).toEqual([["id", ID], ["status", "pending"]])
  })

  it("renewActionToken reports false when the status already changed", async () => {
    expect(await repoWith({ data: [], error: null }).repo.renewActionToken(ID, "new", "2026-10-27T12:00:00.000Z")).toBe(false)
  })
})
