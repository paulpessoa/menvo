/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { POST } from "./route"

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn()
}))

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn()
}))

jest.mock("@/lib/email/brevo", () => ({
  sendAppointmentCancellation: jest.fn()
}))

import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { sendAppointmentCancellation } from "@/lib/email/brevo"

describe("POST /api/appointments/no-show", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function makeRequest(body: any) {
    return new NextRequest("http://localhost:3000/api/appointments/no-show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  it("returns 401 if user is not authenticated", async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }) }
    })

    const res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(401)
  })

  it("returns 400 if appointmentId is missing", async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "mentor-1" } }, error: null }) }
    })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns 404 if appointment is not found", async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "mentor-1" } }, error: null }) }
    })

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error("Not found") })
          })
        })
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const res = await POST(makeRequest({ appointmentId: "apt-nonexistent" }))
    expect(res.status).toBe(404)
  })

  it("returns 403 if authenticated user is not the mentor", async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "intruder" } }, error: null }) }
    })

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "apt-1",
                mentor_id: "mentor-1",
                mentee_id: "mentee-1",
                status: "confirmed",
                scheduled_at: "2026-10-01T10:00:00Z"
              },
              error: null
            })
          })
        })
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(403)
  })

  it("returns 400 if the session is scheduled in the future", async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "mentor-1" } }, error: null }) }
    })

    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "apt-1",
                mentor_id: "mentor-1",
                mentee_id: "mentee-1",
                status: "confirmed",
                scheduled_at: futureDate
              },
              error: null
            })
          })
        })
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const res = await POST(makeRequest({ appointmentId: "apt-1" }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("após o horário agendado")
  })

  it("successfully marks a past confirmed session as cancelled due to no-show", async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "mentor-1" } }, error: null }) }
    })

    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    })
    const deleteFeedbacksMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    })

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "apt-1",
                    mentor_id: "mentor-1",
                    mentee_id: "mentee-1",
                    status: "confirmed",
                    scheduled_at: pastDate,
                    mentor: { id: "mentor-1", full_name: "Mentor Joe", email: "mentor@test.com" },
                    mentee: { id: "mentee-1", full_name: "Mentee Sam", email: "mentee@test.com" }
                  },
                  error: null
                })
              })
            }),
            update: updateMock
          }
        }
        if (table === "appointment_feedbacks") {
          return {
            delete: deleteFeedbacksMock
          }
        }
        return {}
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const res = await POST(makeRequest({
      appointmentId: "apt-1",
      notes: "Aguardei 15 minutos e não apareceu."
    }))

    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: "cancelled",
      cancellation_reason: "Mentorado não compareceu: Aguardei 15 minutos e não apareceu.",
      notes_mentor: "Aguardei 15 minutos e não apareceu.",
      cancelled_by: "mentor-1",
      completed_at: null
    }))
    expect(sendAppointmentCancellation).toHaveBeenCalledWith(expect.objectContaining({
      recipientEmail: "mentee@test.com",
      recipientName: "Mentee Sam"
    }))
  })
})
