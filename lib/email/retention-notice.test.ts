/**
 * @jest-environment node
 */
import {
  buildRetentionNoticeHtml,
  buildRetentionDeletionConfirmationHtml,
  getEmailTemplatePreviewHtml,
  sendRetentionNotice,
  sendRetentionDeletionConfirmation
} from "./brevo"

describe("buildRetentionNoticeHtml", () => {
  const base = {
    name: "Mariana Silva",
    inviteUrl: "https://www.menvo.com.br/convite/abc123",
    deletionDate: "2026-10-25T12:00:00.000Z"
  }

  it("30-day notice includes the deletion date and both the keep-account and delete-now links", () => {
    const html = buildRetentionNoticeHtml({ ...base, daysLeft: 30 })
    expect(html).toContain("25/10/2026")
    expect(html).toContain("https://www.menvo.com.br/convite/abc123?intent=participate")
    expect(html).toContain("https://www.menvo.com.br/convite/abc123?intent=optout")
  })

  it("1-day notice reads as the last warning", () => {
    const html = buildRetentionNoticeHtml({ ...base, daysLeft: 1 })
    expect(html).toContain("último aviso")
  })

  it("escapes the name", () => {
    const html = buildRetentionNoticeHtml({ ...base, name: "<script>alert(1)</script>", daysLeft: 30 })
    expect(html).not.toContain("<script>alert(1)</script>")
  })
})

describe("buildRetentionDeletionConfirmationHtml", () => {
  it("never contains an invite token or /convite link", () => {
    const html = buildRetentionDeletionConfirmationHtml({ name: "Mariana" })
    expect(html).not.toContain("/convite/")
    expect(html).not.toContain("token")
  })

  it("links to creating a new account", () => {
    const html = buildRetentionDeletionConfirmationHtml({ name: "Mariana" })
    expect(html).toContain("/auth/register")
  })
})

describe("getEmailTemplatePreviewHtml retention templates", () => {
  it.each(["retention_notice_30d", "retention_notice_1d", "retention_deletion_confirmation"])(
    "renders %s without throwing",
    key => {
      expect(() => getEmailTemplatePreviewHtml(key)).not.toThrow()
    }
  )
})

describe("sendRetentionNotice / sendRetentionDeletionConfirmation", () => {
  const originalKey = process.env.BREVO_API_KEY

  afterEach(() => {
    process.env.BREVO_API_KEY = originalKey
  })

  it("fail gracefully when BREVO_API_KEY is not configured", async () => {
    delete process.env.BREVO_API_KEY
    const notice = await sendRetentionNotice({
      name: "Mariana",
      email: "mariana@example.com",
      inviteUrl: "https://www.menvo.com.br/convite/abc123",
      deletionDate: "2026-10-25T00:00:00.000Z",
      daysLeft: 30
    })
    expect(notice.success).toBe(false)

    const confirmation = await sendRetentionDeletionConfirmation({ name: "Mariana", email: "mariana@example.com" })
    expect(confirmation.success).toBe(false)
  })
})
