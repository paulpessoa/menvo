import type { OrgDirectory } from "@/lib/ports/org-directory"
import type { OrgMailer } from "@/lib/ports/org-mailer"
import type { JoinTarget, OrganizationsRepository } from "@/lib/repositories/organizations.repository"
import { createMembershipService } from "./membership.service"

const ACTOR = { id: "u1", email: "session@x.org" }
const OPEN: JoinTarget = { id: "o1", name: "Giral", join_policy: "open" }

function setup(over: {
  target?: JoinTarget | null
  status?: "invited" | "requested" | "active" | null
  contact?: { full_name: string | null; email: string | null } | null
  adminEmails?: string[] | Error
  role?: "mentor" | "mentee" | null
} = {}) {
  const repo = {
    findJoinTargetBySlug: jest.fn().mockResolvedValue(over.target === undefined ? OPEN : over.target),
    findMembershipStatus: jest.fn().mockResolvedValue(over.status ?? null),
    requestMembership: jest.fn().mockResolvedValue(undefined),
    acceptInvite: jest.fn().mockResolvedValue(undefined),
    removeMembership: jest.fn().mockResolvedValue(undefined),
    listMembershipsOf: jest.fn().mockResolvedValue([]),
    findOwnContact: jest.fn().mockResolvedValue(over.contact === undefined ? { full_name: "Ana", email: "ana@x.org" } : over.contact),
  }
  const directory = {
    listAdminEmails:
      over.adminEmails instanceof Error
        ? jest.fn().mockRejectedValue(over.adminEmails)
        : jest.fn().mockResolvedValue(over.adminEmails ?? ["admin1@x.org", "admin2@x.org"]),
  }
  const mailer = { sendJoinRequest: jest.fn().mockResolvedValue(undefined) }
  const service = createMembershipService({
    repo: repo as unknown as OrganizationsRepository,
    directory: directory as OrgDirectory,
    mailer: mailer as OrgMailer,
    platformRoleOf: jest.fn().mockResolvedValue(over.role === undefined ? "mentee" : over.role),
  })
  return { service, repo, directory, mailer }
}

beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("join", () => {
  it("is not_found for an unknown or suspended slug and does nothing else", async () => {
    const { service, repo } = setup({ target: null })
    expect(await service.join(ACTOR, "nope")).toEqual({ kind: "not_found" })
    expect(repo.findMembershipStatus).not.toHaveBeenCalled()
  })

  it("an active member gets already_active without writes or e-mails", async () => {
    const { service, repo, mailer } = setup({ status: "active" })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "already_active" })
    expect(repo.requestMembership).not.toHaveBeenCalled()
    expect(mailer.sendJoinRequest).not.toHaveBeenCalled()
  })

  it("a pending request is idempotent: already_requested, no second e-mail", async () => {
    const { service, repo, mailer } = setup({ status: "requested" })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "already_requested" })
    expect(repo.requestMembership).not.toHaveBeenCalled()
    expect(mailer.sendJoinRequest).not.toHaveBeenCalled()
  })

  it("an invite is accepted, even on an invite-only org, and admins are not notified", async () => {
    const { service, repo, mailer } = setup({ status: "invited", target: { ...OPEN, join_policy: "invite_only" } })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "accepted", orgName: "Giral" })
    expect(repo.acceptInvite).toHaveBeenCalledWith("o1", "u1")
    expect(mailer.sendJoinRequest).not.toHaveBeenCalled()
  })

  it("a new request on an invite-only org is refused without writing", async () => {
    const { service, repo } = setup({ target: { ...OPEN, join_policy: "invite_only" } })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "invite_only" })
    expect(repo.requestMembership).not.toHaveBeenCalled()
  })

  it("a new request on an open org is recorded for the actor and every admin is told", async () => {
    const { service, repo, directory, mailer } = setup({ role: "mentor" })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "requested" })

    expect(repo.requestMembership).toHaveBeenCalledWith("o1", "u1")
    expect(directory.listAdminEmails).toHaveBeenCalledWith("o1")
    expect(mailer.sendJoinRequest).toHaveBeenCalledTimes(2)
    expect(mailer.sendJoinRequest).toHaveBeenCalledWith({
      adminEmail: "admin1@x.org",
      requesterName: "Ana",
      requesterEmail: "ana@x.org",
      orgName: "Giral",
      requesterRole: "mentor",
    })
  })

  it("falls back to the session e-mail and 'Alguém' when the profile has no contact", async () => {
    const { service, mailer } = setup({ contact: null, adminEmails: ["a@x.org"] })
    await service.join(ACTOR, "giral")
    expect(mailer.sendJoinRequest).toHaveBeenCalledWith(
      expect.objectContaining({ requesterName: "Alguém", requesterEmail: "session@x.org" })
    )
  })

  it("the request still succeeds when the admins cannot be found (the e-mail is best effort)", async () => {
    const { service, repo, mailer } = setup({ adminEmails: new Error("service role missing") })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "requested" })
    expect(repo.requestMembership).toHaveBeenCalled()
    expect(mailer.sendJoinRequest).not.toHaveBeenCalled()
  })

  it("an org with no admin e-mails sends nothing", async () => {
    const { service, mailer } = setup({ adminEmails: [] })
    expect(await service.join(ACTOR, "giral")).toEqual({ kind: "requested" })
    expect(mailer.sendJoinRequest).not.toHaveBeenCalled()
  })
})

describe("leave and listMine", () => {
  it("leave removes only the actor's own link", async () => {
    const { service, repo } = setup()
    await service.leave(ACTOR, "o1")
    expect(repo.removeMembership).toHaveBeenCalledWith("o1", "u1")
  })

  it("listMine reads the actor's memberships", async () => {
    const { service, repo } = setup()
    await service.listMine(ACTOR)
    expect(repo.listMembershipsOf).toHaveBeenCalledWith("u1")
  })
})
