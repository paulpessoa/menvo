/**
 * @jest-environment node
 *
 * Camada 14 · Teste da confirmação: o servidor revalida tudo antes de executar.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { confirmCapability } from "./confirm"

jest.mock("@/lib/services/mentors/mentors.service", () => ({ mentorService: { searchCatalog: jest.fn() } }))
jest.mock("@/lib/services/mentors/mentor-public.service", () => ({ mentorPublicService: {} }))
jest.mock("@/lib/services/appointments/availability.service", () => ({ computeAvailableSlots: jest.fn() }))

const mentee = { id: "u1", role: "mentee" as const }
const mentor = { id: "u2", role: "mentor" as const }

function dbWith(handlerRows: { appointment?: unknown } = {}) {
  const insert = jest.fn().mockResolvedValue({ error: null })
  const db = {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    from: jest.fn((table: string) => {
      if (table === "appointments")
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: handlerRows.appointment ?? null, error: null })
        }
      return { insert }
    })
  } as unknown as SupabaseClient
  return { db, insert }
}

describe("confirmCapability", () => {
  it("404 para capability inexistente ou fora do papel do ator", async () => {
    const { db } = dbWith()
    expect(await confirmCapability(db, mentee, "nope.nothing", {})).toMatchObject({ ok: false, status: 404 })
    // mentor não enxerga appointments.evaluate (audience mentee/admin)
    expect(
      await confirmCapability(db, mentor, "appointments.evaluate", {
        appointmentId: "33333333-3333-3333-3333-333333333333",
        rating: 5
      })
    ).toMatchObject({ ok: false, status: 404 })
  })

  it("403 para capability de leitura (não passa por confirmação)", async () => {
    const { db } = dbWith()
    expect(await confirmCapability(db, mentee, "mentors.search", { query: "dados" })).toMatchObject({
      ok: false,
      status: 403
    })
  })

  it("400 para input inválido, sem tocar no banco", async () => {
    const { db } = dbWith()
    const result = await confirmCapability(db, mentee, "feedback.save", { rating: 9 })
    expect(result).toMatchObject({ ok: false, status: 400 })
    expect(db.from).not.toHaveBeenCalled()
  })

  it("executa a escrita confirmada e audita", async () => {
    const { db, insert } = dbWith()
    const result = await confirmCapability(db, mentee, "feedback.save", { rating: 5, comment: "ótimo" })
    expect(result).toMatchObject({ ok: true, output: { success: true } })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ rating: 5, comment: "ótimo" }))
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ capability: "feedback.save", outcome: "ok", surface: "assistant" })
    )
  })
})
