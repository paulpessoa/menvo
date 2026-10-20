/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { POST } from "./route"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { RepositoryError } from "@/lib/repositories/repository-error"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/appointments/appointments.composition", () => ({ buildAppointmentsService: jest.fn() }))

// A regra (só o mentorado avalia, uma vez, sessão confirmada ou concluída) é testada
// em appointments.service.test.ts.
describe("POST /api/appointments/complete", () => {
  const evaluate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => {})
    ;(buildAppointmentsService as jest.Mock).mockReturnValue({ evaluate })
  })

  function asUser(id: string | null) {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: id ? { id } : null }, error: id ? null : new Error("No session") }) },
    })
  }

  const request = (body: unknown) =>
    new NextRequest("http://localhost:3000/api/appointments/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

  it("returns 401 without a session", async () => {
    asUser(null)
    expect((await POST(request({ appointmentId: "a1", rating: 5 }))).status).toBe(401)
    expect(buildAppointmentsService).not.toHaveBeenCalled()
  })

  it("returns 400 when the rating is missing or out of range", async () => {
    asUser("mentee-1")
    expect((await POST(request({ appointmentId: "a1" }))).status).toBe(400)
    expect((await POST(request({ appointmentId: "a1", rating: 9 }))).status).toBe(400)
    expect(evaluate).not.toHaveBeenCalled()
  })

  it("passes the logged user and the review to the service and answers 200", async () => {
    asUser("mentee-1")
    evaluate.mockResolvedValue({ kind: "ok" })
    const res = await POST(request({ appointmentId: "a1", rating: "5", privateNotes: "n", publicFeedback: "p" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(evaluate).toHaveBeenCalledWith("a1", "mentee-1", { rating: 5, privateNotes: "n", publicFeedback: "p" })
  })

  it.each([
    [{ kind: "not_found" }, 404, "Agendamento não encontrado"],
    [{ kind: "forbidden" }, 403, "Apenas o mentorado pode avaliar esta mentoria"],
    [{ kind: "wrong_status" }, 400, "Só é possível avaliar sessões confirmadas ou concluídas"],
    [{ kind: "already_evaluated" }, 409, "Esta mentoria já foi avaliada"],
    [{ kind: "feedback_failed" }, 500, "Erro ao registrar avaliação"],
  ])("maps %j to %i with the same message as before", async (result, status, message) => {
    asUser("mentee-1")
    evaluate.mockResolvedValue(result)
    const res = await POST(request({ appointmentId: "a1", rating: 5 }))
    expect(res.status).toBe(status)
    expect((await res.json()).error).toBe(message)
  })

  it("answers 409 with a code when the status changed meanwhile", async () => {
    asUser("mentee-1")
    evaluate.mockResolvedValue({ kind: "changed" })
    const res = await POST(request({ appointmentId: "a1", rating: 5 }))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("status_changed")
  })

  it("answers 500 with the old message on a database error", async () => {
    asUser("mentee-1")
    evaluate.mockRejectedValue(new RepositoryError("appointments.transitionStatus", { message: "boom" }))
    const res = await POST(request({ appointmentId: "a1", rating: 5 }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("Erro ao concluir agendamento")
  })
})
