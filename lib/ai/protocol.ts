import { z } from "zod"

/**
 * SSE protocol for /api/assistant, shared verbatim between server (encode)
 * and client (parse) so the two can never drift on event shape.
 * AI_PLATFORM_PLAN.md §8 Fase 0 item 6.
 *
 * lib/ai/ is the reusable core (AI_PLATFORM_PLAN.md §10) and never imports
 * from lib/services/* — the `mentors_found` payload is validated by the
 * caller (lib/services/assistant/tools.ts' `mentorCardDto`) before it
 * reaches this schema, so here it's opaque records, not the Menvo shape.
 */

const textEvent = z.object({ type: z.literal("text"), text: z.string() })
const toolStartEvent = z.object({ type: z.literal("tool_start"), name: z.string() })
const mentorsFoundEvent = z.object({
  type: z.literal("mentors_found"),
  mentors: z.array(z.record(z.string(), z.unknown()))
})
export const chipOptionSchema = z.object({
  value: z.string(),
  label: z.string()
})
export type ChipOption = z.infer<typeof chipOptionSchema>
const chipsEvent = z.object({
  type: z.literal("chips"),
  mode: z.enum(["single", "multi"]),
  options: z.array(chipOptionSchema),
  allowOther: z.boolean().optional(),
  canSkip: z.boolean().optional()
})
const progressEvent = z.object({
  type: z.literal("progress"),
  step: z.number().int().positive(),
  totalSteps: z.number().int().positive(),
  stepName: z.string().optional()
})
const diagnosticCompleteEvent = z.object({
  type: z.literal("diagnostic_complete"),
  responseId: z.string().uuid(),
  analysis: z.record(z.string(), z.unknown())
})
const resetEvent = z.object({ type: z.literal("reset") })
const errorEvent = z.object({ type: z.literal("error"), message: z.string() })

export const aiEventSchema = z.discriminatedUnion("type", [
  textEvent,
  toolStartEvent,
  mentorsFoundEvent,
  chipsEvent,
  progressEvent,
  diagnosticCompleteEvent,
  resetEvent,
  errorEvent
])

export type AiEvent = z.infer<typeof aiEventSchema>

/** Sentinel line the stream sends instead of a JSON event to signal completion. */
export const SSE_DONE = "[DONE]"

/** `Response.body`'s SSE framing (`data: ...\n\n`) around one typed event. */
export function encodeSseEvent(event: AiEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

export function encodeSseDone(): Uint8Array {
  return new TextEncoder().encode(`data: ${SSE_DONE}\n\n`)
}

/**
 * Parses one `data: ...` SSE line into a typed event, `"done"`, or `null`
 * (not a data line, or a payload the schema rejects — e.g. a partial chunk
 * mid-decode). Never throws: the client reads a stream byte-by-byte and a
 * line can arrive incomplete.
 */
export function parseSseLine(line: string): AiEvent | "done" | null {
  if (!line.startsWith("data: ")) return null
  const payload = line.slice("data: ".length)
  if (payload === SSE_DONE) return "done"

  try {
    const parsed = aiEventSchema.safeParse(JSON.parse(payload))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
