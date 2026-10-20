import type { OrgDirectory } from "@/lib/ports/org-directory"
import type { OrgMailer } from "@/lib/ports/org-mailer"
import type { MemberState, OrganizationsRepository } from "@/lib/repositories/organizations.repository"
import { createOrgAdminService } from "./org-admin.service"

const ORG = "o1"
const ANA = { id: "u-ana", full_name: "Ana Lima", email: "ana@x.org" }

function setup(over: {
  account?: { id: string; full_name: string | null; email: string } | null
  member?: MemberState | null
  approved?: { full_name: string | null; email: string | null } | null
  admins?: number
  role?: "mentor" | "mentee" | null
  mailerFails?: boolean
} = {}) {
  const repo = {
    findById: jest.fn().mockResolvedValue({ id: ORG, name: "Giral" }),
    findMemberState: jest.fn().mockResolvedValue(over.member ?? null),
    approveRequest: jest
      .fn()
      .mockResolvedValue(over.approved === undefined ? { full_name: "Ana Lima", email: "ana@x.org" } : over.approved),
    inviteMember: jest.fn().mockResolvedValue(undefined),
    removeMembership: jest.fn().mockResolvedValue(undefined),
    countActiveAdmins: jest.fn().mockResolvedValue(over.admins ?? 2),
    updateJoinPolicy: jest.fn().mockResolvedValue({ id: ORG, join_policy: "invite_only" }),
  }
  const directory = {
    findAccountByEmail: jest.fn().mockResolvedValue(over.account === undefined ? ANA : over.account),
  }
  const send = () => (over.mailerFails ? jest.fn().mockRejectedValue(new Error("brevo down")) : jest.fn().mockResolvedValue(undefined))
  const mailer = { sendJoinRequest: jest.fn(), sendInvite: send(), sendApproved: send() }
  const service = createOrgAdminService({
    repo: repo as unknown as OrganizationsRepository,
    directory: directory as unknown as OrgDirectory,
    mailer: mailer as unknown as OrgMailer,
    platformRoleOf: jest.fn().mockResolvedValue(over.role === undefined ? "mentor" : over.role),
  })
  return { service, repo, directory, mailer }
}

beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("invite", () => {
  it("no account: nothing is written and nothing is sent", async () => {
    const { service, repo, mailer } = setup({ account: null })
    expect(await service.invite(ORG, "ghost@x.org")).toEqual({ kind: "no_account" })
    expect(repo.findMemberState).not.toHaveBeenCalled()
    expect(repo.inviteMember).not.toHaveBeenCalled()
    expect(mailer.sendInvite).not.toHaveBeenCalled()
  })

  it("already active: answers already_active without writes or e-mails", async () => {
    const { service, repo, mailer } = setup({ member: { role: "member", status: "active" } })
    expect(await service.invite(ORG, ANA.email)).toEqual({ kind: "already_active" })
    expect(repo.inviteMember).not.toHaveBeenCalled()
    expect(repo.approveRequest).not.toHaveBeenCalled()
    expect(mailer.sendInvite).not.toHaveBeenCalled()
    expect(mailer.sendApproved).not.toHaveBeenCalled()
  })

  it("already invited: resends the invite without a second row", async () => {
    const { service, repo, mailer } = setup({ member: { role: "member", status: "invited" } })
    expect(await service.invite(ORG, ANA.email)).toEqual({ kind: "reinvited" })
    expect(repo.inviteMember).not.toHaveBeenCalled()
    expect(mailer.sendInvite).toHaveBeenCalledWith({
      name: "Ana Lima",
      email: "ana@x.org",
      orgName: "Giral",
      recipientRole: "mentor",
    })
  })

  it("pending request: approves on the spot and sends the approval, not the invite", async () => {
    const { service, repo, mailer } = setup({ member: { role: "member", status: "requested" } })
    expect(await service.invite(ORG, ANA.email)).toEqual({ kind: "approved" })
    expect(repo.approveRequest).toHaveBeenCalledWith(ORG, ANA.id)
    expect(repo.inviteMember).not.toHaveBeenCalled()
    expect(mailer.sendApproved).toHaveBeenCalledTimes(1)
    expect(mailer.sendInvite).not.toHaveBeenCalled()
  })

  it("no link yet: creates the invite and e-mails it; a person without platform role reads as mentee", async () => {
    const { service, repo, mailer } = setup({ role: null })
    expect(await service.invite(ORG, ANA.email)).toEqual({ kind: "invited" })
    expect(repo.inviteMember).toHaveBeenCalledWith(ORG, ANA.id)
    expect(mailer.sendInvite).toHaveBeenCalledWith(expect.objectContaining({ recipientRole: "mentee" }))
  })

  it("falls back to the e-mail as the name when the profile has none", async () => {
    const { service, mailer } = setup({ account: { ...ANA, full_name: null } })
    await service.invite(ORG, ANA.email)
    expect(mailer.sendInvite).toHaveBeenCalledWith(expect.objectContaining({ name: "ana@x.org" }))
  })

  it("an e-mail that fails does not undo the invite", async () => {
    const { service, repo } = setup({ mailerFails: true })
    expect(await service.invite(ORG, ANA.email)).toEqual({ kind: "invited" })
    expect(repo.inviteMember).toHaveBeenCalled()
  })
})

describe("approve", () => {
  it("is not_found when there is no pending request, and sends nothing", async () => {
    const { service, mailer } = setup({ approved: null })
    expect(await service.approve(ORG, "u-x")).toEqual({ kind: "not_found" })
    expect(mailer.sendApproved).not.toHaveBeenCalled()
  })

  it("approves and e-mails the person", async () => {
    const { service, repo, mailer } = setup()
    expect(await service.approve(ORG, ANA.id)).toEqual({ kind: "approved" })
    expect(repo.approveRequest).toHaveBeenCalledWith(ORG, ANA.id)
    expect(mailer.sendApproved).toHaveBeenCalledWith({
      name: "Ana Lima",
      email: "ana@x.org",
      orgName: "Giral",
      recipientRole: "mentor",
    })
  })

  it("approves without an e-mail when the profile has no address", async () => {
    const { service, mailer } = setup({ approved: { full_name: "Ana", email: null } })
    expect(await service.approve(ORG, ANA.id)).toEqual({ kind: "approved" })
    expect(mailer.sendApproved).not.toHaveBeenCalled()
  })

  it("an e-mail that fails does not undo the approval", async () => {
    const { service } = setup({ mailerFails: true })
    expect(await service.approve(ORG, ANA.id)).toEqual({ kind: "approved" })
  })
})

describe("remove", () => {
  it("does not let the admin remove themselves", async () => {
    const { service, repo } = setup()
    expect(await service.remove("me", ORG, "me")).toEqual({ kind: "self" })
    expect(repo.removeMembership).not.toHaveBeenCalled()
  })

  it("D4: refuses to remove the last active admin", async () => {
    const { service, repo } = setup({ member: { role: "admin", status: "active" }, admins: 1 })
    expect(await service.remove("platform-admin", ORG, "u-last")).toEqual({ kind: "last_admin" })
    expect(repo.removeMembership).not.toHaveBeenCalled()
  })

  it("D4: removing an admin is fine when another active admin remains", async () => {
    const { service, repo } = setup({ member: { role: "admin", status: "active" }, admins: 2 })
    expect(await service.remove("me", ORG, "u-other")).toEqual({ kind: "removed" })
    expect(repo.removeMembership).toHaveBeenCalledWith(ORG, "u-other")
  })

  it("removes a plain member, a pending request or an invite without counting admins", async () => {
    for (const status of ["active", "requested", "invited"] as const) {
      const { service, repo } = setup({ member: { role: "member", status } })
      expect(await service.remove("me", ORG, "u-x")).toEqual({ kind: "removed" })
      expect(repo.countActiveAdmins).not.toHaveBeenCalled()
    }
  })

  it("still deletes when there is no link (idempotent, same as before)", async () => {
    const { service, repo } = setup({ member: null })
    expect(await service.remove("me", ORG, "u-x")).toEqual({ kind: "removed" })
    expect(repo.removeMembership).toHaveBeenCalledWith(ORG, "u-x")
  })
})

describe("updateJoinPolicy", () => {
  it("passes the policy to the repository and returns the updated org", async () => {
    const { service, repo } = setup()
    expect(await service.updateJoinPolicy(ORG, "invite_only")).toEqual({ id: ORG, join_policy: "invite_only" })
    expect(repo.updateJoinPolicy).toHaveBeenCalledWith(ORG, "invite_only")
  })
})
