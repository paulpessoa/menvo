import { encodeSseEvent, encodeSseDone, parseSseLine, type AiEvent } from "./protocol"

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

describe("protocol", () => {
  it("round-trips every event type through encode -> parse", () => {
    const events: AiEvent[] = [
      { type: "text", text: "olá" },
      { type: "tool_start", name: "searchMentors" },
      { type: "mentors_found", mentors: [] },
      {
        type: "chips",
        mode: "single",
        options: [{ value: "ensino-medio", label: "Ensino Médio" }],
        allowOther: true
      },
      { type: "progress", step: 1, totalSteps: 7, stepName: "Momento de carreira" },
      {
        type: "diagnostic_complete",
        responseId: "123e4567-e89b-12d3-a456-426614174000",
        analysis: { titulo_personalizado: "Seu Plano" }
      },
      { type: "reset" },
      { type: "error", message: "boom" }
    ]

    for (const event of events) {
      const line = decode(encodeSseEvent(event)).trim()
      expect(parseSseLine(line)).toEqual(event)
    }
  })

  it("encodes and parses the done sentinel", () => {
    const line = decode(encodeSseDone()).trim()
    expect(parseSseLine(line)).toBe("done")
  })

  it("returns null for non-data lines", () => {
    expect(parseSseLine("")).toBeNull()
    expect(parseSseLine("event: ping")).toBeNull()
  })

  it("returns null for malformed or schema-rejected payloads instead of throwing", () => {
    expect(parseSseLine("data: {not json")).toBeNull()
    expect(parseSseLine(`data: ${JSON.stringify({ type: "unknown_type" })}`)).toBeNull()
    expect(parseSseLine(`data: ${JSON.stringify({ type: "text" })}`)).toBeNull() // missing text
  })
})
