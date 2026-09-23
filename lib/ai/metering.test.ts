import { recordAiCalls, type AiCallRecord } from "./metering"

const call: AiCallRecord = {
  provider: "google",
  model: "gemini-3.5-flash-lite",
  inputTokens: 1200,
  outputTokens: 80,
  cachedInputTokens: 0,
  latencyMs: 812.4,
  status: "ok"
}

function fakeSupabase() {
  const rpc = jest.fn().mockResolvedValue({ data: "id", error: null })
  return { client: { rpc } as never, rpc }
}

describe("recordAiCalls", () => {
  const original = process.env.AI_METERING_KEY
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {})
  })
  afterEach(() => {
    process.env.AI_METERING_KEY = original
    warn.mockRestore()
  })

  it("sends the server key with every call so users cannot forge usage", async () => {
    process.env.AI_METERING_KEY = "server-secret"
    const { client, rpc } = fakeSupabase()

    await recordAiCalls(client, "assistant", [call, call], "run-1")

    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc).toHaveBeenCalledWith("record_ai_usage", expect.objectContaining({
      p_server_key: "server-secret",
      p_feature: "assistant",
      p_latency_ms: 812,
      p_run_id: "run-1"
    }))
  })

  it("skips the RPC and warns when the key is not configured", async () => {
    delete process.env.AI_METERING_KEY
    const { client, rpc } = fakeSupabase()

    await recordAiCalls(client, "match", [call])

    expect(rpc).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("AI_METERING_KEY"))
  })

  it("never throws when the database rejects the call", async () => {
    process.env.AI_METERING_KEY = "wrong"
    const rpc = jest.fn().mockResolvedValue({ data: null, error: { message: "metering not authorized" } })

    await expect(recordAiCalls({ rpc } as never, "match", [call])).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
  })
})
