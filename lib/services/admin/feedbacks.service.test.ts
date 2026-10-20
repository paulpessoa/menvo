/**
 * @jest-environment node
 */
import { AdminForbiddenError } from "./assert-admin"
import { createAdminFeedbacksService, FeedbackNotFoundError } from "./feedbacks.service"

const rpc = jest.fn()
const repo = { listPending: jest.fn(), moderate: jest.fn() }
const notifyMentor = jest.fn()
const audit = jest.fn()
const service = createAdminFeedbacksService({
  sessionDb: { rpc } as never,
  repo,
  notifyMentor,
  audit
})

const ID = "11111111-1111-4111-8111-111111111111"
const ROW = {
  id: ID,
  rating: 5,
  public_feedback: "Ótima mentoria",
  reviewed_id: "mentor-1",
  mentee: { full_name: "Ana" },
  mentor: { full_name: "Bia", email: "bia@example.com" }
}

beforeEach(() => {
  jest.clearAllMocks()
  rpc.mockResolvedValue({ data: true, error: null })
  notifyMentor.mockResolvedValue(undefined)
  audit.mockResolvedValue(undefined)
  jest.spyOn(console, "error").mockImplementation(() => {})
})

describe("admin feedbacks service", () => {
  it.each([
    ["list", () => service.listPending()],
    ["moderate", () => service.moderate("a1", { feedbackId: ID, status: "approved" })]
  ])("%s refuses a non-admin before touching the repository", async (_n, run) => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(run()).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(repo.listPending).not.toHaveBeenCalled()
    expect(repo.moderate).not.toHaveBeenCalled()
  })

  it("approves, audits and notifies the mentor", async () => {
    repo.moderate.mockResolvedValue(ROW)
    expect(await service.moderate("a1", { feedbackId: ID, status: "approved" })).toBe(ROW)
    expect(repo.moderate).toHaveBeenCalledWith(ID, "approved", null)
    expect(audit).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({ reason: "feedback_moderation", feedbackId: ID, status: "approved" }),
      "mentor-1"
    )
    expect(notifyMentor).toHaveBeenCalledWith({
      mentorEmail: "bia@example.com",
      mentorName: "Bia",
      menteeName: "Ana",
      rating: 5,
      comment: "Ótima mentoria"
    })
  })

  it("rejects with a reason, audits and does not notify", async () => {
    repo.moderate.mockResolvedValue(ROW)
    await service.moderate("a1", { feedbackId: ID, status: "rejected", rejectionReason: "ofensivo" })
    expect(repo.moderate).toHaveBeenCalledWith(ID, "rejected", "ofensivo")
    expect(audit).toHaveBeenCalledTimes(1)
    expect(notifyMentor).not.toHaveBeenCalled()
  })

  it("does not fail the moderation when the e-mail fails", async () => {
    repo.moderate.mockResolvedValue(ROW)
    notifyMentor.mockRejectedValue(new Error("brevo down"))
    await expect(service.moderate("a1", { feedbackId: ID, status: "approved" })).resolves.toBe(ROW)
  })

  it("throws not found for an unknown id and audits nothing", async () => {
    repo.moderate.mockResolvedValue(null)
    await expect(service.moderate("a1", { feedbackId: ID, status: "approved" })).rejects.toBeInstanceOf(
      FeedbackNotFoundError
    )
    expect(audit).not.toHaveBeenCalled()
  })
})
