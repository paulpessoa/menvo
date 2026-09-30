import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { verifyResultLink } from "@/lib/quiz/result-link"

/**
 * "Save my analysis": turns an anonymous quiz into an account, from the link
 * in the results e-mail (`/quiz/results/[id]?k=...`).
 *
 * The signed `k` token (lib/quiz/result-link.ts) proves the caller received
 * that e-mail, so the account is created already confirmed and the person
 * only chooses a password - no second confirmation e-mail. Nothing is created
 * until they explicitly submit a password: opening the e-mail link alone never
 * creates an account for anyone.
 *
 * - GET  ?k=...                 -> { status: "claimable" | "exists", email }
 * - POST { token, password }    -> creates the account, links the quiz to it,
 *                                  returns { email } so the page can sign in.
 */

async function loadVerifiedRow(id: string, token: string) {
  const supabase = createServiceRoleClient()
  const { data: row } = await supabase
    .from("quiz_responses")
    .select("id, name, email, user_id")
    .eq("id", id)
    .maybeSingle()

  if (!row || !verifyResultLink(token, row.id, row.email)) return null
  return { supabase, row }
}

async function accountExists(supabase: ReturnType<typeof createServiceRoleClient>, email: string) {
  const { data } = await supabase.from("profiles").select("id").eq("email", email).limit(1)
  return Boolean(data && data.length > 0)
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const token = request.nextUrl.searchParams.get("k") || ""

  const verified = token ? await loadVerifiedRow(id, token) : null
  if (!verified) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 })
  }

  const { supabase, row } = verified
  const exists = Boolean(row.user_id) || (await accountExists(supabase, row.email))
  return NextResponse.json({ status: exists ? "exists" : "claimable", email: row.email })
}

const bodySchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres.").max(72),
})

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const rate = checkRateLimit(`quiz-account:${ip}`, { maxRequests: 5, windowMs: 10 * 60_000 })
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos" },
      { status: 400 }
    )
  }

  const verified = await loadVerifiedRow(id, parsed.data.token)
  if (!verified) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 })
  }

  const { supabase, row } = verified
  if (row.user_id || (await accountExists(supabase, row.email))) {
    return NextResponse.json({ status: "exists", email: row.email }, { status: 409 })
  }

  const [firstName, ...rest] = (row.name || "").trim().split(/\s+/)
  const lastName = rest.join(" ")

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: row.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName || "",
      last_name: lastName,
      full_name: (row.name || "").trim(),
    },
  })

  if (createError || !created?.user) {
    // Registered through another path in the meantime (or the profile row
    // was missing): same answer as the pre-check above.
    if (createError?.status === 422 || /already/i.test(createError?.message || "")) {
      return NextResponse.json({ status: "exists", email: row.email }, { status: 409 })
    }
    // Password rejected by the project's auth policy (length/strength).
    if (createError?.status === 400) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }
    console.error("[quiz/account] falha ao criar conta:", createError?.message)
    return NextResponse.json({ error: "Não foi possível criar sua conta" }, { status: 500 })
  }

  await supabase
    .from("quiz_responses")
    .update({ user_id: created.user.id })
    .eq("id", row.id)
    .is("user_id", null)

  return NextResponse.json({ ok: true, email: row.email })
}
