/**
 * @jest-environment node
 */
import { AdminForbiddenError } from "./assert-admin"
import { createAdminEmailsService } from "./emails.service"

const rpc = jest.fn()
const mailer = {
  sendReengagementInvite: jest.fn(),
  renderReengagementPreview: jest.fn(),
  renderTemplatePreview: jest.fn(),
  sendTestEmail: jest.fn()
}
const service = createAdminEmailsService({ sessionDb: { rpc } as never, mailer })

beforeEach(() => {
  jest.clearAllMocks()
  rpc.mockResolvedValue({ data: true, error: null })
})

describe("admin emails service", () => {
  it.each([
    ["preview", () => service.previewTemplate("confirmation")],
    ["send test", () => service.sendTest("a@b.co", "confirmation")]
  ])("%s refuses a non-admin before touching the mailer", async (_n, run) => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(run()).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(mailer.renderTemplatePreview).not.toHaveBeenCalled()
    expect(mailer.sendTestEmail).not.toHaveBeenCalled()
  })

  it("refuses when the is_admin() call itself fails (deny by default)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } })
    await expect(service.previewTemplate("x")).rejects.toBeInstanceOf(AdminForbiddenError)
  })

  it("renders the template through the port", async () => {
    mailer.renderTemplatePreview.mockResolvedValue("<p>t</p>")
    expect(await service.previewTemplate("cancellation")).toBe("<p>t</p>")
    expect(mailer.renderTemplatePreview).toHaveBeenCalledWith("cancellation")
  })

  it("sends the test e-mail through the port", async () => {
    mailer.sendTestEmail.mockResolvedValue({ success: true })
    expect(await service.sendTest("a@b.co", "confirmation")).toEqual({ success: true })
    expect(mailer.sendTestEmail).toHaveBeenCalledWith({ to: "a@b.co", templateKey: "confirmation" })
  })
})
