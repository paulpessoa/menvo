import { createHmac, timingSafeEqual } from "crypto"

/**
 * Signed `?k=` token on the results link we e-mail after a quiz analysis.
 * Holding it proves the person received that e-mail, which is what lets
 * `/api/quiz/[id]/account` create a confirmed account for that address
 * without a second confirmation e-mail.
 *
 * The plain results URL (`/quiz/results/[id]`) is public and shared on
 * LinkedIn/WhatsApp by design; the token is not - the results page drops it
 * from the address bar and the share buttons never include it.
 *
 * Keyed off the service role key (server-only secret already configured
 * everywhere) with a domain-separation label, so no new env var is needed.
 */
const LABEL = "menvo:quiz-account-link:v1"
const TTL_MS = 30 * 24 * 60 * 60 * 1000

function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  return key
}

function mac(quizId: string, email: string, expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(`${LABEL}|${quizId}|${email.trim().toLowerCase()}|${expiresAt}`)
    .digest("base64url")
}

export function signResultLink(quizId: string, email: string, now = Date.now()): string {
  const expiresAt = now + TTL_MS
  return `${expiresAt.toString(36)}.${mac(quizId, email, expiresAt)}`
}

export function verifyResultLink(token: string, quizId: string, email: string, now = Date.now()): boolean {
  const [expPart, sig] = token.split(".")
  if (!expPart || !sig) return false

  const expiresAt = parseInt(expPart, 36)
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false

  const expected = Buffer.from(mac(quizId, email, expiresAt))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function buildResultUrl(quizId: string, email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
  return `${appUrl}/quiz/results/${quizId}?k=${signResultLink(quizId, email)}`
}
