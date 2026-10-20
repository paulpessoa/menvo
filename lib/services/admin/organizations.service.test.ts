/**
 * @jest-environment node
 */
import { AdminForbiddenError } from "./assert-admin"
import { createAdminOrganizationsService } from "./organizations.service"

const rpc = jest.fn()
const repo = {
  listWithMembers: jest.fn(),
  slugExists: jest.fn(),
  create: jest.fn(),
  setStatus: jest.fn(),
  findProfileIdByEmail: jest.fn(),
  promoteMemberToAdmin: jest.fn(),
  addAdminMember: jest.fn()
}
const orgs = { findMemberState: jest.fn() }
const leads = { list: jest.fn(), setStatus: jest.fn() }
const service = createAdminOrganizationsService({
  sessionDb: { rpc } as never,
  repo,
  orgs,
  leads
})

const INPUT = { name: "Org", slug: "org", type: "ngo" as const }

beforeEach(() => {
  jest.clearAllMocks()
  rpc.mockResolvedValue({ data: true, error: null })
})

describe("admin organizations service", () => {
  it.each([
    ["list", () => service.listOrganizations()],
    ["create", () => service.createOrganization(INPUT)],
    ["status", () => service.setOrganizationStatus("o1", "suspended")],
    ["assign admin", () => service.assignOrgAdmin("o1", "a@b.co")],
    ["list leads", () => service.listOrgLeads()],
    ["lead status", () => service.setOrgLeadStatus("l1", "closed")]
  ])("%s refuses a non-admin before touching the database", async (_n, run) => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(run()).rejects.toBeInstanceOf(AdminForbiddenError)
    for (const fn of [...Object.values(repo), ...Object.values(orgs), ...Object.values(leads)]) {
      expect(fn).not.toHaveBeenCalled()
    }
  })

  it("counts only active members", async () => {
    repo.listWithMembers.mockResolvedValue([
      {
        id: "o1",
        name: "Org",
        organization_members: [
          { user_id: "a", status: "active" },
          { user_id: "b", status: "invited" },
          { user_id: "c", status: "active" }
        ]
      }
    ])
    const [org] = await service.listOrganizations()
    expect(org.member_count).toBe(2)
    expect(org).not.toHaveProperty("organization_members")
  })

  it("reports a taken slug without inserting", async () => {
    repo.slugExists.mockResolvedValue(true)
    expect(await service.createOrganization(INPUT)).toEqual({ kind: "slug_taken" })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it("creates the organization when the slug is free", async () => {
    repo.slugExists.mockResolvedValue(false)
    repo.create.mockResolvedValue({ id: "o1" })
    expect(await service.createOrganization(INPUT)).toEqual({
      kind: "created",
      organization: { id: "o1" }
    })
    expect(repo.create).toHaveBeenCalledWith(INPUT)
  })

  it("answers no_account when the e-mail has no profile", async () => {
    repo.findProfileIdByEmail.mockResolvedValue(null)
    expect(await service.assignOrgAdmin("o1", "x@y.z")).toEqual({ kind: "no_account" })
    expect(repo.addAdminMember).not.toHaveBeenCalled()
  })

  it("promotes an existing membership", async () => {
    repo.findProfileIdByEmail.mockResolvedValue("u1")
    orgs.findMemberState.mockResolvedValue({ role: "member", status: "active" })
    expect(await service.assignOrgAdmin("o1", "a@b.co")).toEqual({ kind: "assigned", userId: "u1" })
    expect(repo.promoteMemberToAdmin).toHaveBeenCalledWith("o1", "u1")
    expect(repo.addAdminMember).not.toHaveBeenCalled()
  })

  it("adds a new admin membership when there is none", async () => {
    repo.findProfileIdByEmail.mockResolvedValue("u1")
    orgs.findMemberState.mockResolvedValue(null)
    await service.assignOrgAdmin("o1", "a@b.co")
    expect(repo.addAdminMember).toHaveBeenCalledWith("o1", "u1")
    expect(repo.promoteMemberToAdmin).not.toHaveBeenCalled()
  })
})
