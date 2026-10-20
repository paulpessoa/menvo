/**
 * @jest-environment node
 */
import { AdminForbiddenError } from "./assert-admin"
import { createAdminFeatureFlagsService, FeatureFlagNotFoundError } from "./feature-flags.service"

const rpc = jest.fn()
const repo = {
  listFlags: jest.fn(),
  listAuditLogs: jest.fn(),
  createFlag: jest.fn(),
  setEnabled: jest.fn(),
  deleteFlag: jest.fn(),
  addAuditLog: jest.fn()
}
const getRepo = jest.fn(() => repo)
const service = createAdminFeatureFlagsService({ sessionDb: { rpc } as never, repo: getRepo })

const FLAG = { id: 7, name: "chat", description: null, enabled: true, tags: null, updated_at: null }

beforeEach(() => {
  jest.clearAllMocks()
  rpc.mockResolvedValue({ data: true, error: null })
  repo.addAuditLog.mockResolvedValue(undefined)
  jest.spyOn(console, "error").mockImplementation(() => {})
})

describe("admin feature flags service", () => {
  it.each([
    ["list", () => service.listFlagsWithLogs()],
    ["create", () => service.createFlag("a1", { name: "x" })],
    ["toggle", () => service.setFlagEnabled("a1", 7, true)],
    ["delete", () => service.deleteFlag("a1", 7)]
  ])("%s refuses a non-admin before building the privileged repository", async (_n, run) => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(run()).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(getRepo).not.toHaveBeenCalled()
  })

  it("lists flags with the last 20 audit rows", async () => {
    repo.listFlags.mockResolvedValue([FLAG])
    repo.listAuditLogs.mockResolvedValue([])
    expect(await service.listFlagsWithLogs()).toEqual({ flags: [FLAG], logs: [] })
    expect(repo.listAuditLogs).toHaveBeenCalledWith(20)
  })

  it("creates a flag and audits it", async () => {
    repo.createFlag.mockResolvedValue({ ...FLAG, enabled: false })
    await service.createFlag("a1", { name: "chat", tags: ["x"] })
    expect(repo.createFlag).toHaveBeenCalledWith({ name: "chat", description: null, tags: ["x"] })
    expect(repo.addAuditLog).toHaveBeenCalledWith({ flag_name: "chat", action: "Criada", performed_by: "a1" })
  })

  it("toggles using the database name for the audit row", async () => {
    repo.setEnabled.mockResolvedValue(FLAG)
    await service.setFlagEnabled("a1", 7, false)
    expect(repo.addAuditLog).toHaveBeenCalledWith({ flag_name: "chat", action: "Desativada", performed_by: "a1" })
  })

  it("throws not found for an unknown id and does not audit", async () => {
    repo.setEnabled.mockResolvedValue(null)
    await expect(service.setFlagEnabled("a1", 99, true)).rejects.toBeInstanceOf(FeatureFlagNotFoundError)
    repo.deleteFlag.mockResolvedValue(null)
    await expect(service.deleteFlag("a1", 99)).rejects.toBeInstanceOf(FeatureFlagNotFoundError)
    expect(repo.addAuditLog).not.toHaveBeenCalled()
  })

  it("keeps the change when the audit insert fails", async () => {
    repo.deleteFlag.mockResolvedValue(FLAG)
    repo.addAuditLog.mockRejectedValue(new Error("boom"))
    await expect(service.deleteFlag("a1", 7)).resolves.toBeUndefined()
  })
})
