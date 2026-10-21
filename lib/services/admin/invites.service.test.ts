/**
 * @jest-environment node
 */
import { AdminForbiddenError } from "./assert-admin"
import { createAdminInvitesService } from "./invites.service"

const rpc = jest.fn()
const repo = { findProfilesByIds: jest.fn(), markInviteSent: jest.fn() }
const getRepo = jest.fn(() => repo)
const audience = jest.fn()
const createToken = jest.fn()
const mailer = {
  sendReengagementInvite: jest.fn(),
  renderReengagementPreview: jest.fn(),
  renderTemplatePreview: jest.fn(),
  sendTestEmail: jest.fn()
}
const audit = jest.fn()
const service = createAdminInvitesService({
  sessionDb: { rpc } as never,
  repo: getRepo,
  audience,
  createToken,
  mailer,
  audit,
  appUrl: "https://app.test"
})

const BATCH = { campaign: "c1", subject: "s", body: "b", userIds: ["u1", "u2"] }

beforeEach(() => {
  jest.clearAllMocks()
  rpc.mockResolvedValue({ data: true, error: null })
  repo.findProfilesByIds.mockResolvedValue([
    { id: "u1", email: "u1@x.co", full_name: "U One" },
    { id: "u2", email: null, full_name: null }
  ])
  repo.markInviteSent.mockResolvedValue(undefined)
  createToken.mockResolvedValue({ token: "tok" })
  mailer.sendReengagementInvite.mockResolvedValue({ success: true })
  audit.mockResolvedValue(undefined)
  jest.spyOn(console, "error").mockImplementation(() => undefined)
})

describe("admin invites service", () => {
  it.each([
    ["audience", () => service.resolveAudience({ audience: "all", campaign: "c1" })],
    ["preview", () => service.previewInvite("oi")],
    ["send", () => service.sendBatch("a1", BATCH)]
  ])("%s refuses a non-admin before using any privileged piece", async (_n, run) => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(run()).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(getRepo).not.toHaveBeenCalled()
    expect(audience).not.toHaveBeenCalled()
    expect(createToken).not.toHaveBeenCalled()
    expect(mailer.sendReengagementInvite).not.toHaveBeenCalled()
    expect(mailer.renderReengagementPreview).not.toHaveBeenCalled()
  })

  it("renders the preview with a fake name and token link", async () => {
    mailer.renderReengagementPreview.mockResolvedValue("<p>ok</p>")
    expect(await service.previewInvite("Olá")).toBe("<p>ok</p>")
    expect(mailer.renderReengagementPreview).toHaveBeenCalledWith({
      name: "Mariana Silva",
      bodyText: "Olá",
      inviteUrl: "https://app.test/convite/preview-token"
    })
  })

  it("sends in order token, e-mail, mark, and audits the totals", async () => {
    const out = await service.sendBatch("a1", BATCH)

    expect(createToken).toHaveBeenCalledWith({
      userId: "u1",
      campaign: "c1",
      subject: "s",
      sentBy: "a1",
      resend: undefined
    })
    expect(mailer.sendReengagementInvite).toHaveBeenCalledWith({
      name: "U One",
      email: "u1@x.co",
      subject: "s",
      bodyText: "b",
      inviteUrl: "https://app.test/convite/tok"
    })
    expect(repo.markInviteSent).toHaveBeenCalledWith("u1")
    expect(out.success).toBe(1)
    expect(out.failed).toBe(1)
    expect(out.results[1]).toEqual({ userId: "u2", success: false, error: "Perfil sem e-mail cadastrado" })
    expect(audit).toHaveBeenCalledWith("a1", { campaign: "c1", subject: "s", count: 2, success: 1, failed: 1 })
  })

  it("reads the batch profiles in one query", async () => {
    await service.sendBatch("a1", BATCH)
    expect(repo.findProfilesByIds).toHaveBeenCalledTimes(1)
    expect(repo.findProfilesByIds).toHaveBeenCalledWith(["u1", "u2"])
  })

  it("keeps the mailer message and does not mark the invite as sent", async () => {
    mailer.sendReengagementInvite.mockResolvedValue({ success: false, error: "Brevo down" })
    const out = await service.sendBatch("a1", { ...BATCH, userIds: ["u1"] })
    expect(out.results[0].error).toBe("Brevo down")
    expect(repo.markInviteSent).not.toHaveBeenCalled()
  })

  it("replaces unexpected (database) messages with a fixed text", async () => {
    createToken.mockRejectedValue(new Error('duplicate key value violates "x_pkey"'))
    const out = await service.sendBatch("a1", { ...BATCH, userIds: ["u1"] })
    expect(out.results[0].error).toBe("Erro ao enviar o convite")
  })
})
