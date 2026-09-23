import { resolveModelChain } from "./resolve"
import { DEFAULT_MODEL_CONFIG } from "./defaults"

describe("resolveModelChain", () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {})
  })
  afterEach(() => {
    warn.mockRestore()
  })

  it("builds a chain from a valid, active row (source: db, fallback order preserved)", () => {
    const rows = [
      {
        capability: "route",
        provider: "groq",
        model: "openai/gpt-oss-20b",
        params: { temperature: 0 },
        fallback: [
          { provider: "google", model: "gemini-2.5-flash-lite", params: {} },
          { provider: "openai", model: "gpt-5-nano", params: { maxOutputTokens: 50 } }
        ],
        active: true
      }
    ]

    const chain = resolveModelChain("route", rows)

    expect(chain.source).toBe("db")
    expect(chain.primary).toEqual({ provider: "groq", model: "openai/gpt-oss-20b", params: { temperature: 0 } })
    expect(chain.fallbacks.map((f) => f.model)).toEqual(["gemini-2.5-flash-lite", "gpt-5-nano"])
    expect(warn).not.toHaveBeenCalled()
  })

  it("falls back to defaults (no warning) when rows is null, empty, or has no row for the capability", () => {
    expect(resolveModelChain("route", null)).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(resolveModelChain("route", [])).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(resolveModelChain("route", [{ capability: "converse", provider: "google", model: "x", params: {}, fallback: [], active: true }])).toEqual(
      DEFAULT_MODEL_CONFIG.route
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it("falls back to defaults (no warning) when the row is inactive", () => {
    const rows = [{ capability: "route", provider: "groq", model: "x", params: {}, fallback: [], active: false }]

    expect(resolveModelChain("route", rows)).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(warn).not.toHaveBeenCalled()
  })

  it("falls back to defaults and warns on an unknown provider", () => {
    const rows = [{ capability: "route", provider: "anthropic", model: "x", params: {}, fallback: [], active: true }]

    expect(resolveModelChain("route", rows)).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("route"), expect.any(String))
  })

  it("falls back to defaults and warns on an extra key in params (.strict())", () => {
    const rows = [
      { capability: "route", provider: "groq", model: "x", params: { madeUpKey: true }, fallback: [], active: true }
    ]

    expect(resolveModelChain("route", rows)).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(warn).toHaveBeenCalled()
  })

  it("falls back to defaults and warns when temperature is out of range", () => {
    const rows = [{ capability: "route", provider: "groq", model: "x", params: { temperature: 5 }, fallback: [], active: true }]

    expect(resolveModelChain("route", rows)).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(warn).toHaveBeenCalled()
  })

  it("rejects the whole row when a fallback entry is malformed, rather than dropping just that entry", () => {
    const rows = [
      {
        capability: "route",
        provider: "groq",
        model: "x",
        params: {},
        fallback: [{ provider: "not-a-real-provider", model: "y", params: {} }],
        active: true
      }
    ]

    expect(resolveModelChain("route", rows)).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(warn).toHaveBeenCalled()
  })
})
