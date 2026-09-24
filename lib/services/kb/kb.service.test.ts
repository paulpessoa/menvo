import { KnowledgeBaseService, kbService } from "./kb.service"

describe("KnowledgeBaseService", () => {
  it("finds general articles about Menvo and how it works", () => {
    const results = kbService.search("o que e a menvo e como funciona", { role: "mentee", limit: 3 })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toBe("O que é a Menvo")
    expect(results[0].links.length).toBeGreaterThan(0)
  })

  it("finds diagnostic-related articles with accent insensitivity", () => {
    const withAccents = kbService.search("diagnóstico de carreira", { role: "mentee" })
    const withoutAccents = kbService.search("diagnostico de carreira", { role: "mentee" })

    expect(withAccents.length).toBeGreaterThan(0)
    expect(withoutAccents.length).toBeGreaterThan(0)
    expect(withAccents[0].id).toBe(withoutAccents[0].id)
  })

  it("finds Google Calendar integration articles for mentors", () => {
    const results = kbService.search("google calendar agenda sincronizar", { role: "mentor" })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toContain("Google Calendar")
  })

  it("filters articles by audience correctly", () => {
    const mockArticles = [
      {
        id: "a1",
        title: "Dica Geral",
        category: "comecando",
        audience: ["all"],
        tags: ["geral"],
        summary: "Resumo",
        content: "Conteudo",
        links: [],
        sourcePath: "a1.md"
      },
      {
        id: "a2",
        title: "Exclusivo Mentor",
        category: "mentores",
        audience: ["mentor"],
        tags: ["mentor"],
        summary: "Resumo mentor",
        content: "Conteudo mentor",
        links: [],
        sourcePath: "a2.md"
      }
    ]

    const service = new KnowledgeBaseService(mockArticles as any)

    const menteeResults = service.search("mentor", { role: "mentee" })
    expect(menteeResults.some((r) => r.id === "a2")).toBe(false)

    const mentorResults = service.search("mentor", { role: "mentor" })
    expect(mentorResults.some((r) => r.id === "a2")).toBe(true)
  })

  it("returns empty array when query is empty or has no matching tokens", () => {
    const results = kbService.search("   ")
    expect(results).toEqual([])
  })
})
