/**
 * Eval for lib/services/ai/groq.service.ts — the real network calls, not a
 * mock. Run manually (costs a handful of real LLM calls); never wired into
 * `npm test`. Answers the question the codebase had no way to answer
 * before: "did this prompt/model change make the match better or worse?"
 *
 * Usage:
 *   npm run eval:match
 */
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local isn't loaded automatically outside Next.js — do it manually,
// the same minimal parser used by scripts/_audit_*.mjs in this session.
const envPath = resolve(__dirname, "..", ".env.local")
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (!line.includes("=") || line.startsWith("#")) continue
    const i = line.indexOf("=")
    const key = line.slice(0, i).trim()
    const value = line.slice(i + 1).trim()
    if (key && !(key in process.env)) process.env[key] = value
  }
} catch {
  console.warn(`[eval] Could not read ${envPath} — relying on already-set env vars.`)
}

async function main() {
  const { aiMatchService } = await import("../lib/services/ai/groq.service")
  const { mentors } = await import("./ai-match.fixtures.mjs")
  const { cases } = await import("./ai-match.cases.mjs")

  if (!process.env.OPENAI_API_KEY && !process.env.OPEN_AI_KEY && !process.env.GROQ_API_KEY) {
    console.error("[eval] No OPENAI_API_KEY/OPEN_AI_KEY or GROQ_API_KEY set — nothing to eval against a real model.")
    process.exit(1)
  }

  type Row = {
    query: string
    expected: string
    got: string
    tier: string
    latencyMs: number
    pass: boolean
  }
  const rows: Row[] = []

  for (const c of cases as any[]) {
    const tiers: string[] = []
    const originalWarn = console.warn
    const originalInfo = console.info
    console.warn = (...args: any[]) => tiers.push(String(args[0]))
    console.info = (...args: any[]) => tiers.push(String(args[0]))

    const start = Date.now()
    let result: any
    try {
      result = await aiMatchService.findOptimalMentors(c.query, mentors as any)
    } finally {
      console.warn = originalWarn
      console.info = originalInfo
    }
    const latencyMs = Date.now() - start

    const tier = tiers.some(t => t.includes("deterministic keyword"))
      ? "fallback"
      : tiers.some(t => t.includes("Groq request failed") || t.includes("OpenAI request"))
        ? (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY ? "openai-or-groq" : "groq")
        : (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY ? "openai" : "groq")

    let pass: boolean
    let got: string
    if (c.expectNoMatch) {
      pass = result.no_match === true
      got = result.no_match ? "no_match" : `matched: ${result.suggestions.map((s: any) => s.mentor_id).join(", ")}`
    } else {
      const gotIds = (result.suggestions || []).map((s: any) => s.mentor_id)
      pass = c.expectMentorIds.some((id: string) => gotIds.includes(id))
      got = gotIds.length ? gotIds.join(", ") : (result.no_match ? "no_match" : "(empty)")
    }

    rows.push({
      query: c.query,
      expected: c.expectNoMatch ? "no_match" : c.expectMentorIds.join(", "),
      got,
      tier,
      latencyMs,
      pass
    })
  }

  const passed = rows.filter(r => r.pass).length
  const avgLatency = Math.round(rows.reduce((sum, r) => sum + r.latencyMs, 0) / rows.length)

  console.log("\n=== AI Match Eval ===\n")
  for (const r of rows) {
    const mark = r.pass ? "✓" : "✗"
    console.log(`${mark} [${r.tier}, ${r.latencyMs}ms] "${r.query}"`)
    if (!r.pass) console.log(`    expected: ${r.expected}  |  got: ${r.got}`)
  }
  console.log(`\n${passed}/${rows.length} passed (${Math.round((passed / rows.length) * 100)}%)  ·  avg latency ${avgLatency}ms\n`)

  if (passed < rows.length) process.exitCode = 1
}

main()
