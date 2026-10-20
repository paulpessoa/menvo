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

// A regra (mentor, passado, status, e-mail) é testada em appointments.service.test.ts.
// Aqui só conferimos o que a rota faz: auth -> Zod -> service -> status e corpo HTTP.
describe("POST /api/appointments/no-show", () => {
  const registerNoShow = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => {})
    ;(buildAppointmentsService as jest.Mock).mockReturnValue({ registerNoShow })
  })

  function asUser(id: string | null) {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: id ? { id } : null }, error: id ? null : new Error("No session") }) },
    })
  }

  function makeRequest(body: unknown) {
    return new NextRequest("http://localhost:3000/api/appointments/no-show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  it("returns 401 without a session and never builds the service", async () => {
    asUser(null)
    const res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(401)
    expect(buildAppointmentsService).not.toHaveBeenCalled()
  })

  it("returns 400 if appointmentId is missing", async () => {
    asUser("mentor-1")
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    expect(registerNoShow).not.toHaveBeenCalled()
  })

  it("passes the logged user and the notes to the service and answers 200", async () => {
    asUser("mentor-1")
    registerNoShow.mockResolvedValue({ kind: "ok" })
    const res = await POST(makeRequest({ appointmentId: "apt-1", notes: "Aguardei 15 minutos." }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(registerNoShow).toHaveBeenCalledWith("apt-1", "mentor-1", "Aguardei 15 minutos.")
  })

  it.each([
    [{ kind: "not_found" }, 404, "Agendamento não encontrado"],
    [{ kind: "forbidden" }, 403, "Apenas o mentor pode registrar a ausência do mentorado"],
    [{ kind: "in_future" }, 400, "Só é possível registrar ausência após o horário agendado da sessão"],
    [{ kind: "wrong_status" }, 400, "Só é possível registrar ausência para sessões confirmadas ou concluídas"],
  ])("maps %j to %i with the same message as before", async (result, status, message) => {
    asUser("mentor-1")
    registerNoShow.mockResolvedValue(result)
    const res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(status)
    expect((await res.json()).error).toBe(message)
  })

  it("answers 409 with a stable code when the status changed or the guard refused", async () => {
    asUser("mentor-1")
    registerNoShow.mockResolvedValueOnce({ kind: "changed" })
    let res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("status_changed")

    registerNoShow.mockResolvedValueOnce({ kind: "invalid_transition", message: "x" })
    res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("invalid_transition")
  })

  it("answers 500 with the old message when the database fails", async () => {
    asUser("mentor-1")
    registerNoShow.mockRejectedValue(new RepositoryError("appointments.transitionStatus", { message: "boom" }))
    const res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("Erro ao atualizar agendamento")
  })
})
