import type { AiCapability } from "./capabilities"
import type { ModelSpec } from "./schema"

export interface ModelChain {
  capability: AiCapability
  /** "db" when a valid, active row from `ai_model_config` was used. */
  source: "db" | "default"
  primary: ModelSpec
  fallbacks: ModelSpec[]
}

/** Thrown when every model in a chain has no API key configured. */
export class AiModelUnavailableError extends Error {
  constructor(capability: AiCapability) {
    super(`No AI model available for capability "${capability}" (no provider has an API key configured)`)
    this.name = "AiModelUnavailableError"
  }
}
