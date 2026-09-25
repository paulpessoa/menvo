/**
 * @jest-environment node
 */
import { buildReengagementInviteHtml, getEmailTemplatePreviewHtml, sendReengagementInvite } from "./brevo"

describe("buildReengagementInviteHtml", () => {
  const base = {
    name: "Mariana Silva",
    bodyText: "Olá, {{primeiro_nome}}!\n\nSegunda linha.",
    inviteUrl: "https://www.menvo.com.br/convite/abc123"
  }

  it("substitutes {{primeiro_nome}} with the first name only", () => {
    const html = buildReengagementInviteHtml(base)
    expect(html).toContain("Olá, Mariana!")
    expect(html).not.toContain("{{primeiro_nome}}")
  })

  it("always includes the accept, mentor and opt-out links with their intents", () => {
    const html = buildReengagementInviteHtml(base)
    expect(html).toContain("https://www.menvo.com.br/convite/abc123?intent=participate")
    expect(html).toContain("https://www.menvo.com.br/convite/abc123?intent=mentor")
    expect(html).toContain("https://www.menvo.com.br/convite/abc123?intent=optout")
  })

  it("escapes HTML injected into the admin-editable body", () => {
    const html = buildReengagementInviteHtml({
      ...base,
      bodyText: "Olá <script>alert(1)</script>"
    })
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("&lt;script&gt;")
  })

  it("uses the default origin note when none is provided, and a custom one when given", () => {
    const defaultHtml = buildReengagementInviteHtml(base)
    expect(defaultHtml).toContain("Estágio Recife")

    const customHtml = buildReengagementInviteHtml({ ...base, originNote: "Nota customizada de origem" })
    expect(customHtml).toContain("Nota customizada de origem")
  })

  it("splits blank-line-separated paragraphs into separate <p> tags", () => {
    const html = buildReengagementInviteHtml(base)
    expect(html).toContain("<p>Olá, Mariana!</p>")
    expect(html).toContain("<p>Segunda linha.</p>")
  })
})

describe("getEmailTemplatePreviewHtml('reengagement_invite')", () => {
  it("renders without throwing and includes the brand phrase", () => {
    const html = getEmailTemplatePreviewHtml("reengagement_invite")
    expect(html).toContain("não precisa saber quem pode te ajudar")
  })
})

describe("sendReengagementInvite", () => {
  const originalKey = process.env.BREVO_API_KEY

  afterEach(() => {
    process.env.BREVO_API_KEY = originalKey
  })

  it("fails gracefully when BREVO_API_KEY is not configured", async () => {
    delete process.env.BREVO_API_KEY
    const result = await sendReengagementInvite({
      name: "Mariana",
      email: "mariana@example.com",
      subject: "Oi",
      bodyText: "Corpo do e-mail",
      inviteUrl: "https://www.menvo.com.br/convite/abc123"
    })
    expect(result.success).toBe(false)
  })
})
