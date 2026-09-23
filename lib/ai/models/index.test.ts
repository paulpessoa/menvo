/**
 * @jest-environment node
 *
 * `getModel`/`getStructuredModel`/`getAgentModels` are the seam between the
 * registry (chain resolution) and LangChain (model instances +
 * `withFallbacks`/`withStructuredOutput`). Rather than instantiating real
 * provider SDKs, `./factory` is mocked with tiny fake Runnables that record
 * how they were assembled — this proves the wiring in `index.ts` itself:
 * which spec became the primary, which became fallbacks, and in what order.
 */
import { AiModelUnavailableError } from "./types"
import { __resetModelConfigCache } from "./load"

jest.mock("./factory", () => {
  const actual = jest.requireActual("./factory")
  return { ...actual, createChatModel: jest.fn(), hasApiKey: jest.fn() }
})

import { createChatModel, hasApiKey } from "./factory"
const mockCreateChatModel = createChatModel as jest.MockedFunction<typeof createChatModel>
const mockHasApiKey = hasApiKey as jest.MockedFunction<typeof hasApiKey>

/** A minimal fake Runnable: enough surface for getModel/getStructuredModel/
 * getAgentModels to exercise without a real provider SDK. */
function fakeModel(label: string, opts: { throws?: boolean } = {}) {
  const self: any = {
    label,
    invoke: jest.fn(async () => {
      if (opts.throws) throw new Error(`${label} failed`)
      return { ok: true, from: label }
    }),
    withStructuredOutput: jest.fn(() => self),
    withFallbacks: jest.fn((fallbacks: any[]) => ({
      label: `${label}+fallbacks(${fallbacks.map((f) => f.label).join(",")})`,
      invoke: async (input: unknown) => {
        try {
          return await self.invoke(input)
        } catch {
          for (const fb of fallbacks) {
            try {
              return await fb.invoke(input)
            } catch {
              // try next
            }
          }
          throw new Error("all failed")
        }
      }
    }))
  }
  return self
}

function fakeSupabaseWithNoRows() {
  return {
    from: jest.fn(() => ({ select: jest.fn(async () => ({ data: [], error: null })) }))
  } as never
}

describe("lib/ai/models getModel/getStructuredModel/getAgentModels", () => {
  beforeEach(() => {
    __resetModelConfigCache()
    mockCreateChatModel.mockReset()
    mockHasApiKey.mockReset()
    mockHasApiKey.mockReturnValue(true)
    delete process.env.AI_FORCE_FALLBACK
  })

  it("getModel: wires primary.withFallbacks(fallbacks) in order", async () => {
    const { getModel } = await import("./index")
    const primary = fakeModel("primary")
    const fb1 = fakeModel("fb1")
    mockCreateChatModel.mockImplementation((spec) =>
      (spec.provider === "google" ? primary : fb1) as never
    )

    const model = await getModel(fakeSupabaseWithNoRows(), "route", { onCall: jest.fn() })

    expect(primary.withFallbacks).toHaveBeenCalledWith([fb1])
    expect((model as any).label).toBe("primary+fallbacks(fb1)")
  })

  it("getStructuredModel: applies withStructuredOutput before withFallbacks on every model", async () => {
    const { getStructuredModel } = await import("./index")
    const primary = fakeModel("primary")
    const fb1 = fakeModel("fb1")
    mockCreateChatModel.mockImplementation((spec) => (spec.provider === "google" ? primary : fb1) as never)

    const schema = { parse: (x: unknown) => x } as never
    await getStructuredModel(fakeSupabaseWithNoRows(), "route", schema, { onCall: jest.fn() })

    expect(primary.withStructuredOutput).toHaveBeenCalledWith(schema)
    expect(fb1.withStructuredOutput).toHaveBeenCalledWith(schema)
  })

  it("getStructuredModel: falls back to the next model when the primary throws, and returns its result", async () => {
    const { getStructuredModel } = await import("./index")
    const primary = fakeModel("primary", { throws: true })
    const fb1 = fakeModel("fb1")
    mockCreateChatModel.mockImplementation((spec) => (spec.provider === "google" ? primary : fb1) as never)

    const model = await getStructuredModel(fakeSupabaseWithNoRows(), "route", {} as never, { onCall: jest.fn() })
    const result = await (model as any).invoke("hi")

    expect(result).toEqual({ ok: true, from: "fb1" })
  })

  it("getAgentModels: returns the primary instance and fallback instances separately (for modelFallbackMiddleware)", async () => {
    const { getAgentModels } = await import("./index")
    const primary = fakeModel("primary")
    const fb1 = fakeModel("fb1")
    mockCreateChatModel.mockImplementation((spec) => (spec.provider === "google" ? primary : fb1) as never)

    const { primary: p, fallbacks, chain } = await getAgentModels(fakeSupabaseWithNoRows(), "converse", { onCall: jest.fn() })

    expect(p).toBe(primary)
    expect(fallbacks).toEqual([fb1])
    expect(chain.capability).toBe("converse")
  })

  it("skips a provider with no API key and warns, still building a working chain from what remains", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    try {
      const { getModel } = await import("./index")
      mockHasApiKey.mockImplementation((provider) => provider !== "google")
      const fb1 = fakeModel("fb1")
      mockCreateChatModel.mockReturnValue(fb1 as never)

      const model = await getModel(fakeSupabaseWithNoRows(), "route", { onCall: jest.fn() })

      // Only the (available) fallback was instantiated, no withFallbacks call
      // needed since it's alone in the chain.
      expect(mockCreateChatModel).toHaveBeenCalledTimes(1)
      expect((model as any).label).toBe("fb1")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("google"))
    } finally {
      warn.mockRestore()
    }
  })

  it("throws AiModelUnavailableError when no provider in the chain has an API key", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    try {
      const { getModel } = await import("./index")
      mockHasApiKey.mockReturnValue(false)

      await expect(getModel(fakeSupabaseWithNoRows(), "route", { onCall: jest.fn() })).rejects.toThrow(AiModelUnavailableError)
    } finally {
      warn.mockRestore()
    }
  })

  it("AI_FORCE_FALLBACK=<capability> drops the primary for that capability only (evals)", async () => {
    const { getModel } = await import("./index")
    const primary = fakeModel("primary")
    const fb1 = fakeModel("fb1")
    mockCreateChatModel.mockImplementation((spec) => (spec.provider === "google" ? primary : fb1) as never)

    process.env.AI_FORCE_FALLBACK = "route"
    const forced = await getModel(fakeSupabaseWithNoRows(), "route", { onCall: jest.fn() })
    expect((forced as any).label).toBe("fb1")

    process.env.AI_FORCE_FALLBACK = "converse"
    const notForced = await getModel(fakeSupabaseWithNoRows(), "route", { onCall: jest.fn() })
    expect((notForced as any).label).toBe("primary+fallbacks(fb1)")
  })
})
