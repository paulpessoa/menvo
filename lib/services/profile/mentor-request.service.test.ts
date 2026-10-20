import { ProfileRepositoryError } from "@/lib/repositories/profile.repository"
import { createMentorRequestService } from "./mentor-request.service"

const user = { id: "u1", email: "ana@example.com", user_metadata: { first_name: "Ana", last_name: "Souza" } }
const input = { mentorship_approach: "Sessões práticas", what_to_expect: "Traga um projeto" }

function deps(status: string | null = "pending") {
  const calls: string[] = []
  return {
    calls,
    repo: {
      requestVerification: jest.fn(async () => void calls.push("rpc")),
      saveApproach: jest.fn(async (id: string) => {
        calls.push("save")
        return { user_id: id, verification_status: status }
      }),
    },
    mailer: {
      notifyAdminNewMentor: jest.fn(async () => void calls.push("mail")),
      notifyNewMentee: jest.fn(async () => undefined),
    },
  }
}

describe("mentor request service", () => {
  it("runs the RPC, saves the texts, then warns the admin", async () => {
    const d = deps()
    const outcome = await createMentorRequestService(d).submit(user, input)
    expect(d.calls).toEqual(["rpc", "save", "mail"])
    expect(d.repo.saveApproach).toHaveBeenCalledWith("u1", {
      mentorship_approach: "Sessões práticas",
      what_to_expect: "Traga um projeto",
    })
    expect(d.mailer.notifyAdminNewMentor).toHaveBeenCalledWith({
      userName: "Ana Souza",
      userEmail: "ana@example.com",
      mentorshipApproach: "Sessões práticas",
      whatToExpect: "Traga um projeto",
    })
    expect(outcome).toEqual({
      kind: "ok",
      data: { id: "u1", is_pending_mentor: true, verification_status: "pending" },
    })
  })

  it.each([
    ["pending", true],
    ["changes_requested", true],
    ["approved", false],
    ["rejected", false],
  ])("status %s gives is_pending_mentor=%s", async (status, pending) => {
    const outcome = await createMentorRequestService(deps(status)).submit(user, input)
    expect(outcome.kind === "ok" && outcome.data.is_pending_mentor).toBe(pending)
  })

  it("stores null and omits the e-mail field when what_to_expect is empty", async () => {
    const d = deps()
    await createMentorRequestService(d).submit(user, { ...input, what_to_expect: "" })
    expect(d.repo.saveApproach).toHaveBeenCalledWith("u1", expect.objectContaining({ what_to_expect: null }))
    expect(d.mailer.notifyAdminNewMentor).toHaveBeenCalledWith(expect.objectContaining({ whatToExpect: undefined }))
  })

  it("falls back to the e-mail, then to a generic name", async () => {
    const d = deps()
    await createMentorRequestService(d).submit({ id: "u1", email: "x@y.com" }, input)
    expect(d.mailer.notifyAdminNewMentor).toHaveBeenCalledWith(expect.objectContaining({ userName: "x@y.com" }))
    await createMentorRequestService(d).submit({ id: "u1" }, input)
    expect(d.mailer.notifyAdminNewMentor).toHaveBeenLastCalledWith(expect.objectContaining({ userName: "Usuário" }))
  })

  it("a failing e-mail never fails the request", async () => {
    const d = deps()
    d.mailer.notifyAdminNewMentor.mockRejectedValue(new Error("brevo down"))
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    expect((await createMentorRequestService(d).submit(user, input)).kind).toBe("ok")
  })

  it("returns the raw driver error as cause and sends no e-mail when the RPC fails", async () => {
    const d = deps()
    const raw = { message: "rpc failed", code: "42501" }
    d.repo.requestVerification.mockRejectedValue(new ProfileRepositoryError("rpc", raw))
    const outcome = await createMentorRequestService(d).submit(user, input)
    expect(outcome).toEqual({ kind: "failed", cause: raw })
    expect(d.repo.saveApproach).not.toHaveBeenCalled()
    expect(d.mailer.notifyAdminNewMentor).not.toHaveBeenCalled()
  })
})
