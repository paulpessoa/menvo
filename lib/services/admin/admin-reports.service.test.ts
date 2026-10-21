/**
 * @jest-environment node
 */
import { AdminForbiddenError } from "./assert-admin"
import { getAdminReport } from "./admin-reports.service"

const repo = {
  countProfiles: jest.fn(),
  countByRole: jest.fn(),
  listSignupDates: jest.fn()
}
jest.mock("@/lib/repositories/admin-ops.repository", () => ({
  createAdminReportsRepository: () => repo
}))

const rpc = jest.fn()
const db = { rpc } as never

beforeEach(() => {
  jest.clearAllMocks()
  rpc.mockResolvedValue({ data: true, error: null })
})

describe("getAdminReport", () => {
  it("refuses a non-admin before reading anything", async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(getAdminReport(db, "2020-01-01")).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(repo.countProfiles).not.toHaveBeenCalled()
  })

  it("returns counts and signups grouped by day, oldest first, skipping bad dates", async () => {
    repo.countProfiles.mockResolvedValue(10)
    repo.countByRole.mockImplementation(async (role: string) => (role === "mentor" ? 3 : 6))
    repo.listSignupDates.mockResolvedValue([
      { created_at: "2026-02-02T10:00:00Z" },
      { created_at: "2026-02-01T10:00:00Z" },
      { created_at: "2026-02-02T23:00:00Z" },
      { created_at: null },
      { created_at: "not-a-date" }
    ])
    expect(await getAdminReport(db, "2026-01-01")).toEqual({
      overview: { totalUsers: 10, totalMentors: 3, totalMentees: 6 },
      growth: {
        users: [
          { date: "2026-02-01", count: 1 },
          { date: "2026-02-02", count: 2 }
        ]
      }
    })
    expect(repo.listSignupDates).toHaveBeenCalledWith("2026-01-01")
  })
})
