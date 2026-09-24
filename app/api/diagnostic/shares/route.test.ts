/**
 * @jest-environment node
 */
import { GET, POST } from "./route"
import { DELETE } from "./[id]/route"
import { createClient } from "@/lib/utils/supabase/server"
import { diagnosticSharesService } from "@/lib/services/diagnostic/diagnostic-shares.service"
import { NextRequest } from "next/server"

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn()
}))

jest.mock("@/lib/services/diagnostic/diagnostic-shares.service", () => ({
  diagnosticSharesService: {
    listSharesForMentee: jest.fn(),
    listSharesForMentor: jest.fn(),
    shareDiagnostic: jest.fn(),
    revokeShare: jest.fn(),
    getSharedDiagnosticForMentor: jest.fn()
  }
}))

describe("/api/diagnostic/shares routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/diagnostic/shares", () => {
    it("returns 401 when not logged in", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") })
        }
      })

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares")
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it("lists shares for mentee by default", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-mentee" } }, error: null })
        }
      })

      const mockShares = [{ id: "share-1", mentee_id: "user-mentee" }]
      ;(diagnosticSharesService.listSharesForMentee as jest.Mock).mockResolvedValue(mockShares)

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares")
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.shares).toEqual(mockShares)
      expect(diagnosticSharesService.listSharesForMentee).toHaveBeenCalledWith(
        expect.anything(),
        "user-mentee",
        { quizResponseId: undefined, diagnosticSessionId: undefined }
      )
    })

    it("lists shares for mentor when role=mentor is passed", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-mentor" } }, error: null })
        }
      })

      const mockShares = [{ shareId: "share-2", mentor_id: "user-mentor" }]
      ;(diagnosticSharesService.listSharesForMentor as jest.Mock).mockResolvedValue(mockShares)

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares?role=mentor")
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.shares).toEqual(mockShares)
      expect(diagnosticSharesService.listSharesForMentor).toHaveBeenCalledWith(
        expect.anything(),
        "user-mentor"
      )
    })
  })

  describe("POST /api/diagnostic/shares", () => {
    it("rejects invalid input schema with 400", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-mentee" } }, error: null })
        }
      })

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares", {
        method: "POST",
        body: JSON.stringify({ mentor_id: "invalid-uuid" })
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it("prevents sharing diagnostic with oneself", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: "28e83366-cfc1-41ee-a859-da415b3c3c78" } }, error: null })
        }
      })

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares", {
        method: "POST",
        body: JSON.stringify({
          mentor_id: "28e83366-cfc1-41ee-a859-da415b3c3c78",
          quiz_response_id: "550e8400-e29b-41d4-a716-446655440000"
        })
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain("você mesmo")
    })

    it("creates share successfully when payload is valid", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: "11111111-1111-1111-1111-111111111111" } }, error: null })
        }
      })

      const createdShare = {
        id: "share-new",
        mentee_id: "11111111-1111-1111-1111-111111111111",
        mentor_id: "22222222-2222-2222-2222-222222222222",
        quiz_response_id: "33333333-3333-3333-3333-333333333333",
        scope: "summary"
      }
      ;(diagnosticSharesService.shareDiagnostic as jest.Mock).mockResolvedValue(createdShare)

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares", {
        method: "POST",
        body: JSON.stringify({
          mentor_id: "22222222-2222-2222-2222-222222222222",
          quiz_response_id: "33333333-3333-3333-3333-333333333333",
          scope: "summary"
        })
      })

      const res = await POST(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.share).toEqual(createdShare)
    })
  })

  describe("DELETE /api/diagnostic/shares/[id]", () => {
    it("revokes share for authenticated mentee", async () => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-mentee" } }, error: null })
        }
      })

      ;(diagnosticSharesService.revokeShare as jest.Mock).mockResolvedValue(undefined)

      const req = new NextRequest("http://localhost:3000/api/diagnostic/shares/share-123", {
        method: "DELETE"
      })

      const res = await DELETE(req, { params: Promise.resolve({ id: "share-123" }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(diagnosticSharesService.revokeShare).toHaveBeenCalledWith(
        expect.anything(),
        "share-123",
        "user-mentee"
      )
    })
  })
})
