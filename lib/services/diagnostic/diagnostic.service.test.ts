import { DiagnosticService } from "./diagnostic.service"

describe("DiagnosticService", () => {
  let service: DiagnosticService

  beforeEach(() => {
    service = new DiagnosticService()
  })

  it("getActiveSession returns null when no in-progress session exists", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    } as any

    const session = await service.getActiveSession(supabase, "user-123")
    expect(session).toBeNull()
  })

  it("getActiveSession marks session as abandoned if expires_at is in the past", async () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    const updateMock = jest.fn().mockReturnThis()
    const eqMock = jest.fn().mockResolvedValue({ error: null })

    const supabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "diagnostic_sessions") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: "sess-expired",
                user_id: "user-123",
                status: "in_progress",
                expires_at: expiredDate
              },
              error: null
            }),
            update: updateMock.mockReturnValue({ eq: eqMock })
          }
        }
        return {}
      })
    } as any

    const session = await service.getActiveSession(supabase, "user-123")
    expect(session).toBeNull()
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "abandoned" })
    )
  })

  it("createSession initializes with current_step: 1 and in_progress", async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: "new-sess",
            user_id: "user-123",
            status: "in_progress",
            current_step: 1
          },
          error: null
        })
      })
    })

    const supabase = {
      from: jest.fn().mockReturnValue({
        insert: insertMock
      })
    } as any

    const session = await service.createSession(supabase, "user-123")
    expect(session.id).toBe("new-sess")
    expect(session.current_step).toBe(1)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        status: "in_progress",
        current_step: 1
      })
    )
  })
})
