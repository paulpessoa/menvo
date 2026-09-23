import { createLangChainUsageCollector } from "./langchain-metering"

describe("createLangChainUsageCollector", () => {
  it("records one call per chat-model run with normalized provider/model", () => {
    const collector = createLangChainUsageCollector()

    collector.handle({ event: "on_chat_model_start", run_id: "r1" })
    collector.handle({ event: "on_chat_model_stream", run_id: "r1", data: {} })
    collector.handle({
      event: "on_chat_model_end",
      run_id: "r1",
      metadata: { ls_provider: "google_genai", ls_model_name: "models/gemini-3.5-flash-lite" },
      data: { output: { usage_metadata: { input_tokens: 900, output_tokens: 40, input_token_details: { cache_read: 600 } } } }
    })
    collector.handle({ event: "on_tool_end", run_id: "t1", data: {} })
    collector.handle({ event: "on_chat_model_start", run_id: "r2" })
    collector.handle({
      event: "on_chat_model_end",
      run_id: "r2",
      metadata: { ls_provider: "groq", ls_model_name: "qwen/qwen3.8-27b" },
      data: { output: { usage_metadata: { input_tokens: 1500, output_tokens: 80 } } }
    })

    expect(collector.calls).toEqual([
      expect.objectContaining({ provider: "google", model: "gemini-3.5-flash-lite", inputTokens: 900, outputTokens: 40, cachedInputTokens: 600 }),
      expect.objectContaining({ provider: "groq", model: "qwen/qwen3.8-27b", inputTokens: 1500, outputTokens: 80, cachedInputTokens: 0 })
    ])
  })

  it("still records the call when the provider omits usage", () => {
    const collector = createLangChainUsageCollector()
    collector.handle({ event: "on_chat_model_end", run_id: "r1", data: { output: {} } })

    expect(collector.calls).toEqual([
      expect.objectContaining({ provider: "unknown", model: "unknown", inputTokens: 0, outputTokens: 0 })
    ])
  })
})
