/**
 * @jest-environment node
 */
import {
  getEmailTemplatePreviewHtml,
  buildInactiveNoticeHtml,
  sendMentorContactEmail,
  sendAppointmentCancellation,
} from "./brevo"

const TEMPLATE_KEYS = [
  "confirmation",
  "verification",
  "feedback",
  "cancellation",
  "reminder",
  "org_invite",
  "org_invite_mentor",
  "org_join_request",
  "org_membership_approved",
  "org_membership_approved_mentor",
  "reengagement_invite",
  "retention_notice_30d",
  "retention_notice_1d",
  "retention_deletion_confirmation",
  "inactive_notice_30d",
  "inactive_deletion_confirmation",
  "quiz_results",
]

describe("LGPD footer", () => {
  it.each(TEMPLATE_KEYS)("%s has the privacy policy link and the data-protection contact", (key) => {
    const html = getEmailTemplatePreviewHtml(key)
    expect(html).toContain("/privacy")
    expect(html).toContain("mailto:contato@menvo.com.br")
  })

  it("renders the privacy link exactly once per e-mail", () => {
    for (const key of TEMPLATE_KEYS) {
      const html = getEmailTemplatePreviewHtml(key)
      expect(html.match(/\/privacy"/g)).toHaveLength(1)
    }
  })

  it("inactivity notice says why the person is receiving it and offers deletion", () => {
    const html = buildInactiveNoticeHtml({ name: "Mariana", deletionDate: "2026-11-01T12:00:00.000Z" })
    expect(html).toContain("porque tem uma conta na Menvo")
    expect(html).toContain("/settings")
  })
})

describe("user text escaping", () => {
  const originalKey = process.env.BREVO_API_KEY
  const fetchMock = jest.fn()

  beforeEach(() => {
    process.env.BREVO_API_KEY = "test-key"
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterAll(() => {
    process.env.BREVO_API_KEY = originalKey
  })

  const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body)

  it("escapes the cancellation reason", async () => {
    await sendAppointmentCancellation({
      recipientEmail: "a@example.com",
      recipientName: "Ana",
      otherPersonName: "Beto",
      scheduledAt: "2026-10-10T15:00:00.000Z",
      reason: "<script>alert(1)</script>",
      cancelledByName: "Beto",
    })
    const { htmlContent } = sentBody()
    expect(htmlContent).not.toContain("<script>alert(1)</script>")
    expect(htmlContent).toContain("&lt;script&gt;")
  })

  it("mentor contact e-mail tells the mentee why they got it and how to stop", async () => {
    await sendMentorContactEmail({
      menteeEmail: "m@example.com",
      menteeName: "Maria",
      mentorEmail: "mentor@example.com",
      mentorName: "Carlos <b>",
      mentorExpertise: [],
      mentorSlug: "carlos",
    })
    const body = sentBody()
    expect(body.htmlContent).toContain("um mentor da plataforma quis falar com você")
    expect(body.htmlContent).toContain("mailto:contato@menvo.com.br?subject=")
    expect(body.htmlContent).not.toContain("Carlos <b>")
    // subject is a header, not HTML: stays raw
    expect(body.subject).toBe("Carlos <b> quer ajudar você.")
  })
})
