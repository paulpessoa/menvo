import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/utils/supabase/server"
import { quizAccountBodySchema, quizIdParamSchema } from "@/lib/schemas/quiz"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

/**
 * "Save my analysis": turns an anonymous quiz into an account, from the link
 * in the results e-mail (`/quiz/results/[id]?k=...`).
 *
 * The signed `k` token (lib/quiz/result-link.ts) proves the caller received
 * that e-mail, so the account is created already confirmed and the person
 * only chooses a password - no second confirmation e-mail. Nothing is created
 * until they explicitly submit a password: opening the e-mail link alone never
 * creates an account for anyone. The `service_role` use behind this is an
 * accepted exception, see ADR 0007; it never reaches this file.
 *
 * - GET  ?k=...                 -> { status: "claimable" | "exists", email }
 * - POST { token, password }    -> creates the account, links the quiz to it,
 *                                  returns { email } so the page can sign in.
 */

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = quizIdParamSchema.safeParse(await context.params)
  const token = request.nextUrl.searchParams.get("k") || ""

  const status =
    params.success && token
      ? await buildQuizService(await createClient()).checkAccountLink(params.data.id, token)
      : null
  if (!status) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 })
  }
  return NextResponse.json(status)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = quizIdParamSchema.safeParse(await context.params)

  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const rate = checkRateLimit(`quiz-account:${ip}`, { maxRequests: 5, windowMs: 10 * 60_000 })
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 })
  }

  const body = quizAccountBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message || "Dados inválidos" }, { status: 400 })
  }

  // An id that is not a UUID can never match a row: same answer as a bad token.
  if (!params.success) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 })
  }

  const outcome = await buildQuizService(await createClient()).createAccountFromResults(
    params.data.id,
    body.data.token,
    body.data.password
  )

  switch (outcome.kind) {
    case "invalid_link":
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 })
    case "exists":
      return NextResponse.json({ status: "exists", email: outcome.email }, { status: 409 })
    case "password_rejected":
      // Password rejected by the project's auth policy (length/strength).
      return NextResponse.json({ error: outcome.message }, { status: 400 })
    case "failed":
      return NextResponse.json({ error: "Não foi possível criar sua conta" }, { status: 500 })
    case "created":
      return NextResponse.json({ ok: true, email: outcome.email })
  }
}
