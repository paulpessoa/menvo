import { NextRequest, NextResponse } from "next/server"
import { getEmailTemplatePreviewHtml } from "@/lib/email/brevo"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const template = searchParams.get("template") || "confirmation"

  const html = getEmailTemplatePreviewHtml(template)

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  })
}
