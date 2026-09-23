import { createMeteringCallback } from "./callback"

describe("createMeteringCallback", () => {
  it("records tokens, cache and latency from usage_metadata on success", async () => {
    const onCall = jest.fn()
    const cb = createMeteringCallback({ provider: "google", model: "gemini-2.5-flash-lite", isFallback: false, onCall })

    await cb.handleChatModelStart?.({} as never, [], "run-1")
    await cb.handleLLMEnd?.(
      {
        generations: [
          [
            {
              text: "",
              message: {
                usage_metadata: { input_tokens: 900, output_tokens: 40, input_token_details: { cache_read: 600 } }
              }
            } as never
          ]
        ]
      },
      "run-1"
    )

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        model: "gemini-2.5-flash-lite",
        inputTokens: 900,
        outputTokens: 40,
        cachedInputTokens: 600,
        status: "ok"
      })
    )
    expect(onCall.mock.calls[0][0].latencyMs).toBeGreaterThanOrEqual(0)
  })

  it("records zero tokens when usage_metadata is missing, without throwing", async () => {
    const onCall = jest.fn()
    const cb = createMeteringCallback({ provider: "groq", model: "openai/gpt-oss-20b", isFallback: false, onCall })

    await cb.handleLLMEnd?.({ generations: [[{ text: "", message: {} } as never]] }, "run-2")

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({ inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, status: "ok" })
    )
  })

  it("records status: error with the error's name, never its message", async () => {
    const onCall = jest.fn()
    const cb = createMeteringCallback({ provider: "openai", model: "gpt-4o-mini", isFallback: false, onCall })

    await cb.handleChatModelStart?.({} as never, [], "run-3")
    await cb.handleLLMError?.(Object.assign(new Error("contains user prompt content"), { name: "RateLimitError" }), "run-3")

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error", inputTokens: 0, outputTokens: 0, errorCode: "RateLimitError" })
    )
    const [[record]] = onCall.mock.calls
    expect(JSON.stringify(record)).not.toContain("contains user prompt content")
  })

  it("tags a fallback model's success as status: fallback", async () => {
    const onCall = jest.fn()
    const cb = createMeteringCallback({ provider: "groq", model: "openai/gpt-oss-120b", isFallback: true, onCall })

    await cb.handleLLMEnd?.({ generations: [[{ text: "", message: {} } as never]] }, "run-4")

    expect(onCall).toHaveBeenCalledWith(expect.objectContaining({ status: "fallback" }))
  })
})
