import { readFileSync } from "fs"
import { join } from "path"
import { AI_CAPABILITIES } from "./capabilities"
import { DEFAULT_MODEL_CONFIG } from "./defaults"

/**
 * Parses the `insert into public.ai_model_config (...) values (...)` seed in
 * the migration into the same shape as `ModelChain`, so this test can prove
 * `DEFAULT_MODEL_CONFIG` (the code's built-in copy) never drifts from the
 * migration (ADR 0004 §3 — "aplicar a migração não muda comportamento").
 */
function parseMigrationSeed(): Record<string, { provider: string; model: string; params: unknown; fallback: unknown }> {
  const sql = readFileSync(
    join(__dirname, "..", "..", "..", "supabase", "migrations", "20260923000004_ai_model_config.sql"),
    "utf8"
  )

  const valuesBlock = sql.split("insert into public.ai_model_config")[1]
  if (!valuesBlock) throw new Error("Could not find the ai_model_config seed in the migration")

  // Matches one tuple: ('capability', 'provider', 'model', 'params-json', 'fallback-json', 'notes')
  const tupleRe =
    /\(\s*'([a-z_]+)',\s*'([a-z]+)',\s*'([^']+)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'[^']*'\s*\)/g

  const result: Record<string, { provider: string; model: string; params: unknown; fallback: unknown }> = {}
  let match: RegExpExecArray | null
  while ((match = tupleRe.exec(valuesBlock))) {
    const [, capability, provider, model, paramsJson, fallbackJson] = match
    result[capability] = {
      provider,
      model,
      params: JSON.parse(paramsJson),
      fallback: JSON.parse(fallbackJson)
    }
  }
  return result
}

describe("DEFAULT_MODEL_CONFIG", () => {
  it("has one entry for every AI_CAPABILITY", () => {
    for (const capability of AI_CAPABILITIES) {
      expect(DEFAULT_MODEL_CONFIG[capability]).toBeDefined()
      expect(DEFAULT_MODEL_CONFIG[capability].capability).toBe(capability)
      expect(DEFAULT_MODEL_CONFIG[capability].source).toBe("default")
    }
  })

  it("matches the seed in supabase/migrations/20260923000004_ai_model_config.sql", () => {
    const seed = parseMigrationSeed()

    // stt is deliberately not seeded (Fase 3, billed per audio minute) and
    // is not part of AI_CAPABILITIES either, so nothing to compare there.
    expect(Object.keys(seed).sort()).toEqual([...AI_CAPABILITIES].sort())

    for (const capability of AI_CAPABILITIES) {
      const chain = DEFAULT_MODEL_CONFIG[capability]
      const row = seed[capability]

      expect({ provider: chain.primary.provider, model: chain.primary.model, params: chain.primary.params }).toEqual({
        provider: row.provider,
        model: row.model,
        params: row.params
      })
      expect(chain.fallbacks).toEqual(row.fallback)
    }
  })

  it("omits temperature on the analyze fallback (gpt-5-mini rejects a non-default value)", () => {
    const fallback = DEFAULT_MODEL_CONFIG.analyze.fallbacks[0]
    expect(fallback.model).toBe("gpt-5-mini")
    expect(fallback.params.temperature).toBeUndefined()
  })
})
