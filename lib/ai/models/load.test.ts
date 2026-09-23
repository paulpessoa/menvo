import { loadModelChain, __resetModelConfigCache } from "./load"
import { DEFAULT_MODEL_CONFIG } from "./defaults"

function fakeSupabase(impl: () => Promise<{ data: unknown; error: unknown }>) {
  const select = jest.fn(impl)
  const from = jest.fn(() => ({ select }))
  return { from: from as unknown as never, select }
}

describe("loadModelChain", () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    __resetModelConfigCache()
    warn = jest.spyOn(console, "warn").mockImplementation(() => {})
  })
  afterEach(() => {
    warn.mockRestore()
  })

  it("resolves the capability from the rows it reads", async () => {
    const rows = [
      { capability: "route", provider: "groq", model: "openai/gpt-oss-20b", params: {}, fallback: [], active: true }
    ]
    const { from, select } = fakeSupabase(async () => ({ data: rows, error: null }))

    const chain = await loadModelChain({ from } as never, "route")

    expect(chain.source).toBe("db")
    expect(chain.primary.model).toBe("openai/gpt-oss-20b")
    expect(select).toHaveBeenCalledTimes(1)
  })

  it("caches the read for 60s: a second call within the window makes no new query", async () => {
    jest.useFakeTimers()
    try {
      const { from, select } = fakeSupabase(async () => ({ data: [], error: null }))

      await loadModelChain({ from } as never, "route")
      await loadModelChain({ from } as never, "converse")

      expect(select).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(61_000)
      await loadModelChain({ from } as never, "route")

      expect(select).toHaveBeenCalledTimes(2)
    } finally {
      jest.useRealTimers()
    }
  })

  it("falls back to defaults without throwing when the read errors", async () => {
    const { from } = fakeSupabase(async () => ({ data: null, error: { message: "permission denied" } }))

    const chain = await loadModelChain({ from } as never, "route")

    expect(chain).toEqual(DEFAULT_MODEL_CONFIG.route)
    expect(warn).toHaveBeenCalled()
  })

  it("falls back to defaults without throwing when the read never resolves (timeout)", async () => {
    jest.useFakeTimers()
    try {
      const from = jest.fn(() => ({ select: jest.fn(() => new Promise(() => {})) }))

      const promise = loadModelChain({ from } as never, "route")
      jest.advanceTimersByTime(1_600)
      const chain = await promise

      expect(chain).toEqual(DEFAULT_MODEL_CONFIG.route)
      expect(warn).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})
