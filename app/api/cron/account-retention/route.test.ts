/**
 * @jest-environment node
 */
import { GET } from "./route"
import { runRetention } from "@/lib/services/retention/run-retention.service"

jest.mock("@/lib/services/retention/run-retention.service", () => ({
  runRetention: jest.fn()
}))

function emptyReport(mode: "dry_run" | "live") {
  return {
    mode,
    planned: { release: 0, enroll: 0, delete: 0, notice_1d: 0, notice_30d: 0 },
    released: [],
    enrolled: [],
    deleted: [],
    noticed30d: [],
    noticed1d: [],
    deferredToNextRun: { emails: 0, deletions: 0 },
    errors: []
  }
}

describe("GET /api/cron/account-retention", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.RETENTION_MODE
    delete process.env.RETENTION_MAX_EMAILS_PER_RUN
    delete process.env.RETENTION_MAX_DELETIONS_PER_RUN
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("fails closed with 500 when CRON_SECRET is not configured, even with no auth header at all", async () => {
    delete process.env.CRON_SECRET
    const req = new Request("http://localhost:3000/api/cron/account-retention")

    const res = await GET(req)
    expect(res.status).toBe(500)
    expect(runRetention).not.toHaveBeenCalled()
  })

  it("returns 401 when the Authorization header does not match CRON_SECRET", async () => {
    process.env.CRON_SECRET = "test-secret"
    const req = new Request("http://localhost:3000/api/cron/account-retention", {
      headers: { authorization: "Bearer wrong" }
    })

    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(runRetention).not.toHaveBeenCalled()
  })

  it("defaults to dry_run when RETENTION_MODE is not set", async () => {
    process.env.CRON_SECRET = "test-secret"
    ;(runRetention as jest.Mock).mockResolvedValue(emptyReport("dry_run"))

    const req = new Request("http://localhost:3000/api/cron/account-retention", {
      headers: { authorization: "Bearer test-secret" }
    })

    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(runRetention).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "dry_run", maxEmails: 100, maxDeletions: 25 })
    )
  })

  it("passes through RETENTION_MODE=live and the configured caps", async () => {
    process.env.CRON_SECRET = "test-secret"
    process.env.RETENTION_MODE = "live"
    process.env.RETENTION_MAX_EMAILS_PER_RUN = "50"
    process.env.RETENTION_MAX_DELETIONS_PER_RUN = "10"
    ;(runRetention as jest.Mock).mockResolvedValue(emptyReport("live"))

    const req = new Request("http://localhost:3000/api/cron/account-retention", {
      headers: { authorization: "Bearer test-secret" }
    })

    await GET(req)
    expect(runRetention).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "live", maxEmails: 50, maxDeletions: 10, deadline: expect.any(Number) })
    )
  })

  it("returns success: false when the report has errors, without throwing", async () => {
    process.env.CRON_SECRET = "test-secret"
    ;(runRetention as jest.Mock).mockResolvedValue({
      ...emptyReport("live"),
      errors: [{ userId: "u1", action: "delete", message: "boom" }]
    })

    const req = new Request("http://localhost:3000/api/cron/account-retention", {
      headers: { authorization: "Bearer test-secret" }
    })

    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(false)
  })

  it("returns 500 when runRetention throws", async () => {
    process.env.CRON_SECRET = "test-secret"
    ;(runRetention as jest.Mock).mockRejectedValue(new Error("db unreachable"))

    const req = new Request("http://localhost:3000/api/cron/account-retention", {
      headers: { authorization: "Bearer test-secret" }
    })

    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
