/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createAppointmentFeedbacksRepository } from "./appointment-feedbacks.repository"
import { RepositoryError } from "./repository-error"

const NOW = new Date("2026-10-20T12:00:00.000Z")

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
  return { repo: createAppointmentFeedbacksRepository(db, () => NOW), db, calls: q.calls }
}

describe("appointment feedbacks repository", () => {
  it("findByReviewer filters by appointment and reviewer", async () => {
    const { repo, db, calls } = repoWith({ data: { id: "f1" }, error: null })
    expect(await repo.findByReviewer("a1", "u1")).toEqual({ id: "f1" })
    expect(db.from).toHaveBeenCalledWith("appointment_feedbacks")
    expect(calls.eq).toEqual([["appointment_id", "a1"], ["reviewer_id", "u1"]])
  })

  it("findOwner treats a non-UUID id as not found", async () => {
    const { repo } = repoWith({ data: null, error: { code: "22P02", message: "invalid uuid" } })
    expect(await repo.findOwner("123")).toBeNull()
  })

  it("listForUser(received) filters on reviewed_id and normalizes the embeds", async () => {
    const { repo, calls } = repoWith({
      data: [
        {
          id: "f1",
          rating: 5,
          public_feedback: "ótimo",
          status: "pending",
          created_at: "2026-10-19T10:00:00Z",
          rejection_reason: null,
          mentee: [{ full_name: "Bia", email: "b@x.co" }],
          mentor: { full_name: "Ana", email: "a@x.co" },
        },
      ],
      error: null,
    })
    const items = await repo.listForUser({ userId: "u1", type: "received" })
    expect(calls.eq).toEqual([["reviewed_id", "u1"]])
    expect(items[0].mentee?.full_name).toBe("Bia")
    expect(items[0].mentor?.full_name).toBe("Ana")
  })

  it("listForUser(sent) filters on reviewer_id", async () => {
    const { repo, calls } = repoWith({ data: [], error: null })
    await repo.listForUser({ userId: "u1", type: "sent" })
    expect(calls.eq).toEqual([["reviewer_id", "u1"]])
  })

  it("updatePublicFeedback sends the review back to moderation", async () => {
    const { repo, calls } = repoWith({ error: null })
    await repo.updatePublicFeedback("f1", "novo texto")
    expect(calls.update[0][0]).toEqual({ public_feedback: "novo texto", status: "pending", updated_at: NOW.toISOString() })
    expect(calls.eq).toEqual([["id", "f1"]])
  })

  it("insert and deleteByAppointment wrap errors in RepositoryError", async () => {
    const { repo } = repoWith({ error: { message: "denied" } })
    await expect(
      repo.insert({ appointment_id: "a1", reviewer_id: "u1", reviewed_id: "u2", rating: 5 })
    ).rejects.toThrow(RepositoryError)
    await expect(repo.deleteByAppointment("a1")).rejects.toThrow("appointmentFeedbacks.deleteByAppointment: denied")
  })

  it("deleteByAppointment deletes by appointment id", async () => {
    const { repo, calls } = repoWith({ error: null })
    await repo.deleteByAppointment("a1")
    expect(calls.delete).toHaveLength(1)
    expect(calls.eq).toEqual([["appointment_id", "a1"]])
  })
})
