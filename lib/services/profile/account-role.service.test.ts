import { ProfileRepositoryError } from "@/lib/repositories/profile.repository"
import { createAccountRoleService } from "./account-role.service"

const NOW = new Date("2026-10-19T12:00:00.000Z")
const user = { id: "u1", email: "ana@example.com", user_metadata: { full_name: "Ana Souza" } }

function deps() {
  const calls: string[] = []
  const track = <T>(name: string, value: T) =>
    jest.fn(async (..._args: unknown[]) => {
      calls.push(name)
      return value
    })
  return {
    calls,
    profile: {
      updateProfileFields: track("updateProfileFields", undefined),
      upsertLearningGoals: track("upsertLearningGoals", undefined),
      saveInclusiveTags: track("saveInclusiveTags", undefined),
      hideProfile: track("hideProfile", { id: "u1", is_public: false as boolean | null }),
    },
    verification: {
      requestVerification: track("requestVerification", undefined),
      withdrawVerification: track("withdrawVerification", undefined),
    },
    catalog: {
      findByNames: track("findByNames", [
        { id: 1, name: "mentee" },
        { id: 2, name: "mentor" },
      ]),
    },
    userRoles: {
      remove: track("removeRole", undefined),
      addIfMissing: track("addRole", true),
    },
    mailer: { notifyNewMentee: jest.fn(async () => undefined) },
    now: () => NOW,
  }
}

describe("account role service: chooseRole", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("mentee: saves the profile, swaps to mentee, no verification, welcome e-mail", async () => {
    const d = deps()
    const outcome = await createAccountRoleService(d).chooseRole(user, "mentee", {
      city: "Recife",
      learning_goals: "Primeiro emprego",
    })

    expect(outcome).toEqual({ kind: "ok", role: "mentee", status: "approved" })
    expect(d.profile.updateProfileFields).toHaveBeenCalledWith("u1", { updated_at: NOW.toISOString(), city: "Recife" })
    expect(d.profile.upsertLearningGoals).toHaveBeenCalledWith("u1", "Primeiro emprego")
    expect(d.verification.requestVerification).not.toHaveBeenCalled()
    expect(d.userRoles.remove).toHaveBeenCalledWith("u1", [2])
    expect(d.userRoles.addIfMissing).toHaveBeenCalledWith("u1", 1)
    expect(d.mailer.notifyNewMentee).toHaveBeenCalledWith({ email: "ana@example.com", name: "Ana Souza" })
  })

  it("mentor: asks for verification and stays a mentee until the admin approves", async () => {
    const d = deps()
    const outcome = await createAccountRoleService(d).chooseRole(user, "mentor", { inclusive_tags: ["lgbtqia"] })

    expect(outcome).toEqual({ kind: "ok", role: "mentor", status: "pending" })
    expect(d.verification.requestVerification).toHaveBeenCalled()
    expect(d.profile.saveInclusiveTags).toHaveBeenCalledWith("u1", ["lgbtqia"])
    expect(d.userRoles.addIfMissing).toHaveBeenCalledWith("u1", 1) // role "mentee", id 1
    expect(d.userRoles.remove).toHaveBeenCalledWith("u1", [2])
    expect(d.mailer.notifyNewMentee).not.toHaveBeenCalled()
  })

  it("never writes any role besides mentor and mentee (no admin path)", async () => {
    const d = deps()
    await createAccountRoleService(d).chooseRole(user, "mentee", undefined)
    expect(d.catalog.findByNames).toHaveBeenCalledWith(["mentor", "mentee"])
  })

  it("does not repeat the role or the e-mail when the person already has it", async () => {
    const d = deps()
    d.userRoles.addIfMissing.mockResolvedValue(false)
    await createAccountRoleService(d).chooseRole(user, "mentee", undefined)
    expect(d.mailer.notifyNewMentee).not.toHaveBeenCalled()
  })

  it("only writes the strings and arrays it was given", async () => {
    const d = deps()
    await createAccountRoleService(d).chooseRole(user, "mentee", {
      mentorship_topics: ["a"],
      job_title: undefined,
    })
    expect(d.profile.updateProfileFields).toHaveBeenCalledWith("u1", {
      updated_at: NOW.toISOString(),
      mentorship_topics: ["a"],
    })
  })

  it.each([
    ["profile update", (d: ReturnType<typeof deps>) => d.profile.updateProfileFields],
    ["learning goals", (d: ReturnType<typeof deps>) => d.profile.upsertLearningGoals],
    ["verification request", (d: ReturnType<typeof deps>) => d.verification.requestVerification],
  ])("a failed %s stops before touching roles", async (_name, pick) => {
    const d = deps()
    pick(d).mockRejectedValue(new ProfileRepositoryError("x", { message: "denied" }))
    const outcome = await createAccountRoleService(d).chooseRole(user, "mentor", { learning_goals: "x" })
    expect(outcome).toEqual({ kind: "failed" })
    expect(d.userRoles.remove).not.toHaveBeenCalled()
    expect(d.userRoles.addIfMissing).not.toHaveBeenCalled()
  })

  it("a failed inclusive tags write does not fail the request", async () => {
    const d = deps()
    d.profile.saveInclusiveTags.mockRejectedValue(new Error("boom"))
    const outcome = await createAccountRoleService(d).chooseRole(user, "mentor", { inclusive_tags: ["x"] })
    expect(outcome.kind).toBe("ok")
  })

  it("a failed role swap is logged but the answer is still ok (as before)", async () => {
    const d = deps()
    d.userRoles.remove.mockRejectedValue(new Error("rls"))
    d.userRoles.addIfMissing.mockRejectedValue(new Error("rls"))
    expect((await createAccountRoleService(d).chooseRole(user, "mentee", undefined)).kind).toBe("ok")
  })

  it("falls back to a generic name in the welcome e-mail", async () => {
    const d = deps()
    await createAccountRoleService(d).chooseRole({ id: "u1", email: "x@y.com" }, "mentee", undefined)
    expect(d.mailer.notifyNewMentee).toHaveBeenCalledWith({ email: "x@y.com", name: "Mentorado" })
  })
})

describe("account role service: stopMentoring", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("withdraws verification and hides the profile BEFORE swapping the role", async () => {
    const d = deps()
    const outcome = await createAccountRoleService(d).stopMentoring("u1")

    expect(outcome).toEqual({ kind: "ok", profile: { id: "u1", is_public: false } })
    expect(d.calls).toEqual(["withdrawVerification", "hideProfile", "findByNames", "removeRole", "addRole"])
    expect(d.userRoles.remove).toHaveBeenCalledWith("u1", [2])
    expect(d.userRoles.addIfMissing).toHaveBeenCalledWith("u1", 1)
  })

  it("keeps the mentor role when the withdraw RPC fails (it used to be removed first)", async () => {
    const d = deps()
    const raw = { message: "rpc failed" }
    d.verification.withdrawVerification.mockRejectedValue(new ProfileRepositoryError("w", raw))
    const outcome = await createAccountRoleService(d).stopMentoring("u1")

    expect(outcome).toEqual({ kind: "failed", cause: raw })
    expect(d.profile.hideProfile).not.toHaveBeenCalled()
    expect(d.userRoles.remove).not.toHaveBeenCalled()
  })

  it("keeps the mentor role when hiding the profile fails", async () => {
    const d = deps()
    d.profile.hideProfile.mockRejectedValue(new ProfileRepositoryError("h", { message: "denied" }))
    expect((await createAccountRoleService(d).stopMentoring("u1")).kind).toBe("failed")
    expect(d.userRoles.remove).not.toHaveBeenCalled()
  })

  it("calling it twice does not duplicate the mentee role", async () => {
    const d = deps()
    d.userRoles.addIfMissing.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const service = createAccountRoleService(d)
    await service.stopMentoring("u1")
    await service.stopMentoring("u1")
    expect(d.userRoles.addIfMissing).toHaveBeenCalledTimes(2) // the repository decides; the service never inserts directly
  })
})
