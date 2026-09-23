/**
 * @jest-environment node
 *
 * jsdom is missing several Web APIs (ReadableStream, MessageChannel, …) that
 * @langchain/core's module graph touches just on import, even for tests that
 * never make a network call — Node's environment has them natively.
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq"
import { ChatOpenAI } from "@langchain/openai"
import { createChatModel, hasApiKey } from "./factory"
import type { ModelSpec } from "./schema"

const ORIGINAL_ENV = { ...process.env }

function spec(overrides: Partial<ModelSpec> = {}): ModelSpec {
  return { provider: "google", model: "gemini-2.5-flash-lite", params: {}, ...overrides }
}

describe("factory", () => {
  beforeEach(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "google-key"
    process.env.GROQ_API_KEY = "groq-key"
    process.env.OPENAI_API_KEY = "openai-key"
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  describe("hasApiKey", () => {
    it("is true only when the provider's env var is set", () => {
      expect(hasApiKey("google")).toBe(true)
      delete process.env.GROQ_API_KEY
      expect(hasApiKey("groq")).toBe(false)
    })
  })

  describe("createChatModel", () => {
    it("maps google params to maxOutputTokens", () => {
      const model = createChatModel(
        spec({ provider: "google", model: "gemini-2.5-flash", params: { temperature: 0.3, maxOutputTokens: 512 } }),
        { isFallback: false, onCall: jest.fn() }
      ) as unknown as ChatGoogleGenerativeAI

      expect(model).toBeInstanceOf(ChatGoogleGenerativeAI)
      expect(model.temperature).toBe(0.3)
      expect(model.maxOutputTokens).toBe(512)
    })

    it("maps groq/openai params to maxTokens", () => {
      const groqModel = createChatModel(spec({ provider: "groq", model: "openai/gpt-oss-20b", params: { maxOutputTokens: 128 } }), {
        isFallback: false,
        onCall: jest.fn()
      }) as unknown as ChatGroq
      expect(groqModel).toBeInstanceOf(ChatGroq)
      expect(groqModel.maxTokens).toBe(128)

      const openaiModel = createChatModel(spec({ provider: "openai", model: "gpt-4o-mini", params: { maxOutputTokens: 256 } }), {
        isFallback: false,
        onCall: jest.fn()
      }) as unknown as ChatOpenAI
      expect(openaiModel).toBeInstanceOf(ChatOpenAI)
      expect(openaiModel.maxTokens).toBe(256)
    })

    it("omits temperature when absent from params (gpt-5-mini rejects a non-default value)", () => {
      const model = createChatModel(spec({ provider: "openai", model: "gpt-5-mini", params: { maxOutputTokens: 2048 } }), {
        isFallback: false,
        onCall: jest.fn()
      }) as unknown as ChatOpenAI

      expect(model.temperature).toBeUndefined()
    })

    it("defaults maxRetries to 1 for the primary and 0 for a fallback", () => {
      const primary = createChatModel(spec(), { isFallback: false, onCall: jest.fn() }) as unknown as ChatGoogleGenerativeAI
      const fallback = createChatModel(spec(), { isFallback: true, onCall: jest.fn() }) as unknown as ChatGoogleGenerativeAI

      expect((primary as any).caller.maxRetries).toBe(1)
      expect((fallback as any).caller.maxRetries).toBe(0)
    })

    it("respects an explicit maxRetries over the isFallback default", () => {
      const model = createChatModel(spec({ params: { maxRetries: 2 } }), {
        isFallback: true,
        onCall: jest.fn()
      }) as unknown as ChatGoogleGenerativeAI

      expect((model as any).caller.maxRetries).toBe(2)
    })
  })
})
