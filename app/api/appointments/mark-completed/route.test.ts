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

// A regra (só o mentor, só confirmed) é testada em appointments.service.test.ts.
describe("POST /api/appointments/mark-completed", () => {
  const markCompleted = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => {})
    ;(buildAppointmentsService as jest.Mock).mockReturnValue({ markCompleted })
  })

  function asUser(id: string | null) {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: id ? { id } : null }, error: id ? null : new Error("No session") }) },
    })
  }

  const request = (body: unknown) =>
    new NextRequest("http://localhost:3000/api/appointments/mark-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

  it("returns 401 without a session", async () => {
    asUser(null)
    expect((await POST(request({ appointmentId: "apt-1" }))).status).toBe(401)
    expect(buildAppointmentsService).not.toHaveBeenCalled()
  })

  it("returns 400 for a body without appointmentId", async () => {
    asUser("mentor-1")
    const res = await POST(request({}))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("ID do agendamento inválido")
  })

  it("accepts a numeric id (converted to string) and answers 200", async () => {
    asUser("mentor-1")
    markCompleted.mockResolvedValue({ kind: "ok" })
    const res = await POST(request({ appointmentId: 7 }))
    expect(res.status).toBe(200)
    expect(markCompleted).toHaveBeenCalledWith("7", "mentor-1")
  })

  it.each([
    [{ kind: "not_found" }, 404, "Agendamento não encontrado"],
    [{ kind: "forbidden" }, 403, "Apenas o mentor pode marcar esta sessão como concluída"],
    [{ kind: "wrong_status" }, 400, "Só é possível concluir sessões confirmadas"],
  ])("maps %j to %i with the same message as before", async (result, status, message) => {
    asUser("mentor-1")
    markCompleted.mockResolvedValue(result)
    const res = await POST(request({ appointmentId: "apt-1" }))
    expect(res.status).toBe(status)
    expect((await res.json()).error).toBe(message)
  })

  it("answers 409 when the status changed meanwhile", async () => {
    asUser("mentor-1")
    markCompleted.mockResolvedValue({ kind: "changed" })
    const res = await POST(request({ appointmentId: "apt-1" }))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("status_changed")
  })

  it("answers 500 with the old message on a database error", async () => {
    asUser("mentor-1")
    markCompleted.mockRejectedValue(new RepositoryError("appointments.transitionStatus", { message: "boom" }))
    const res = await POST(request({ appointmentId: "apt-1" }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("Erro ao concluir agendamento")
  })
})
