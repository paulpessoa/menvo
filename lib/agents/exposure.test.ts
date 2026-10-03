/**
 * @jest-environment node
 *
 * Camada 14 · Teste de exposição
 * A lista abaixo é o contrato de segurança: liberar algo novo para agentes
 * aparece como diff aqui, e o PR vira a revisão.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { capabilities } from "./registry"
import { capabilitiesFor } from "./exposure"
import { toLangChainTools } from "./adapters/langchain"
import { registerMcpCapabilities } from "./adapters/mcp"

jest.mock("@/lib/services/mentors/mentors.service", () => ({ mentorService: { searchCatalog: jest.fn() } }))
jest.mock("@/lib/services/mentors/mentor-public.service", () => ({ mentorPublicService: {} }))
jest.mock("@/lib/services/appointments/availability.service", () => ({ computeAvailableSlots: jest.fn() }))

const names = (caps: readonly { name: string }[]) => caps.map((c) => c.name)

describe("exposure", () => {
  it("MCP público: só leitura, só as 3 tools de sempre", () => {
    expect(names(capabilitiesFor("mcp", null))).toEqual([
      "mentors.search",
      "mentors.availability",
      "platform.explain"
    ])
  })

  it("MCP ignora a identidade do ator (anônimo é anônimo)", () => {
    expect(names(capabilitiesFor("mcp", { id: "a", role: "admin" }))).toEqual(
      names(capabilitiesFor("mcp", null))
    )
  })

  it("assistente sem login: só as públicas", () => {
    expect(names(capabilitiesFor("assistant", null))).toEqual([
      "mentors.search",
      "mentors.availability",
      "platform.explain",
      "kb.search",
      "feedback.save"
    ])
  })

  it.each([
    ["mentee", ["appointments.mine", "appointments.pendingEvaluations", "appointments.evaluate"]],
    ["mentor", ["appointments.mine", "appointments.mentorRequests"]],
    [
      "admin",
      [
        "appointments.mine",
        "appointments.pendingEvaluations",
        "appointments.evaluate",
        "appointments.mentorRequests"
      ]
    ]
  ] as const)("assistente para %s", (role, extra) => {
    expect(names(capabilitiesFor("assistant", { id: "u1", role }))).toEqual([
      "mentors.search",
      "mentors.availability",
      "platform.explain",
      "kb.search",
      "feedback.save",
      ...extra
    ])
  })

  it("superfície server não libera nada por padrão", () => {
    expect(capabilitiesFor("server", { id: "u1", role: "admin" })).toEqual([])
  })
})

describe("invariantes do registro", () => {
  it("nomes e toolNames são únicos", () => {
    expect(new Set(names(capabilities)).size).toBe(capabilities.length)
    expect(new Set(capabilities.map((c) => c.toolName)).size).toBe(capabilities.length)
  })

  it("nada além de leitura chega ao MCP", () => {
    expect(capabilitiesFor("mcp", null).every((c) => c.effect === "read")).toBe(true)
  })

  it("toda capability declara a confirmação explicitamente", () => {
    expect(capabilities.every((c) => c.confirmation === "none" || c.confirmation === "user")).toBe(true)
  })
})

describe("adapters", () => {
  const supabase = {} as SupabaseClient

  it("LangChain: mantém os nomes de tool que o prompt e o SSE usam", () => {
    const tools = toLangChainTools(supabase, { id: "u1", role: "mentee" })
    expect(tools.map((t) => t.name)).toEqual([
      "searchMentors",
      "getMentorAvailability",
      "explainHowItWorks",
      "searchKnowledgeBase",
      "saveFeedback",
      "getMyAppointments",
      "getPendingEvaluations",
      "evaluateMentorshipSession"
    ])
  })

  it("MCP: registra só o que a exposição libera, com o nome de fio", () => {
    const registerTool = jest.fn()
    registerMcpCapabilities({ registerTool } as never, supabase)
    expect(registerTool.mock.calls.map((c) => c[0])).toEqual([
      "searchMentors",
      "getMentorAvailability",
      "explainHowItWorks"
    ])
  })

  it("MCP: handler devolve JSON indentado e o fallback de mentor não encontrado", async () => {
    const registerTool = jest.fn()
    const { mentorPublicService } = jest.requireMock("@/lib/services/mentors/mentor-public.service")
    mentorPublicService.getMentorBySlugOrId = jest.fn().mockResolvedValue(null)
    registerMcpCapabilities({ registerTool } as never, supabase)
    const availability = registerTool.mock.calls.find((c) => c[0] === "getMentorAvailability")![2]
    const result = await availability({ slug: "x", days: 7 })
    expect(result.content[0].text).toBe(JSON.stringify({ error: "Mentor not found" }, null, 2))
  })
})
