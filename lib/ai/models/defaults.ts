import type { AiCapability } from "./capabilities"
import type { ModelChain } from "./types"

/**
 * Built-in copy of the `ai_model_config` seed (AI_PLATFORM_PLAN.md §11.2;
 * migration `supabase/migrations/20260923000004_ai_model_config.sql`). Used
 * whenever the table is empty, unreadable, or a row fails validation (ADR
 * 0004 §5) — the platform never depends on the database being seeded to have
 * a working model.
 *
 * Keep this in sync with the migration's `insert into ai_model_config …`:
 * `lib/ai/models/defaults.test.ts` parses the SQL file and fails the build
 * if they drift apart.
 */
export const DEFAULT_MODEL_CONFIG: Record<AiCapability, ModelChain> = {
  route: {
    capability: "route",
    source: "default",
    primary: {
      provider: "google",
      model: "gemini-2.5-flash-lite",
      params: { temperature: 0, maxOutputTokens: 64, maxRetries: 1 }
    },
    fallbacks: [
      {
        provider: "groq",
        model: "openai/gpt-oss-20b",
        params: { temperature: 0, maxOutputTokens: 64 }
      }
    ]
  },
  extract: {
    capability: "extract",
    source: "default",
    primary: {
      provider: "google",
      model: "gemini-2.5-flash-lite",
      params: { temperature: 0, maxOutputTokens: 512, maxRetries: 1 }
    },
    fallbacks: [
      {
        provider: "groq",
        model: "openai/gpt-oss-20b",
        params: { temperature: 0, maxOutputTokens: 512 }
      }
    ]
  },
  followup: {
    capability: "followup",
    source: "default",
    primary: {
      provider: "google",
      model: "gemini-2.5-flash-lite",
      params: { temperature: 0.4, maxOutputTokens: 150, maxRetries: 1 }
    },
    fallbacks: [
      {
        provider: "groq",
        model: "openai/gpt-oss-20b",
        params: { temperature: 0.4, maxOutputTokens: 150 }
      }
    ]
  },
  converse: {
    capability: "converse",
    source: "default",
    primary: {
      provider: "google",
      model: "gemini-3.5-flash-lite",
      params: { temperature: 0.3, maxOutputTokens: 1024, maxRetries: 1 }
    },
    fallbacks: [
      {
        provider: "groq",
        model: "openai/gpt-oss-120b",
        params: { temperature: 0.3, maxOutputTokens: 1024 }
      }
    ]
  },
  analyze: {
    capability: "analyze",
    source: "default",
    primary: {
      provider: "google",
      model: "gemini-2.5-flash",
      params: { temperature: 0.4, maxOutputTokens: 2048, maxRetries: 1 }
    },
    // gpt-5-mini is a reasoning model and rejects a non-default temperature.
    fallbacks: [
      {
        provider: "openai",
        model: "gpt-5-mini",
        params: { maxOutputTokens: 2048 }
      }
    ]
  },
  classify_batch: {
    capability: "classify_batch",
    source: "default",
    primary: {
      provider: "google",
      model: "gemini-2.5-flash-lite",
      params: { temperature: 0, maxOutputTokens: 256, maxRetries: 2 }
    },
    fallbacks: []
  },
  // Not in §11.2: keeps what production runs today (match.service.ts) so
  // applying the migration changes no behavior in the match feature.
  rank: {
    capability: "rank",
    source: "default",
    primary: {
      provider: "openai",
      model: "gpt-4o-mini",
      params: { temperature: 0.2, maxOutputTokens: 1024, maxRetries: 1 }
    },
    fallbacks: [
      {
        provider: "groq",
        model: "openai/gpt-oss-20b",
        params: { temperature: 0.2, maxOutputTokens: 1024 }
      }
    ]
  }
}
