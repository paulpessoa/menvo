/**
 * @jest-environment node
 *
 * Camada 9 · Teste de drift do contrato
 * Falha se uma rota de um domínio documentado não tiver `registerPath`, se um
 * path documentado não tiver rota, ou se um domínio novo de `app/api` aparecer
 * sem estar documentado nem na lista de pendentes.
 */
import fs from "node:fs"
import path from "node:path"
import { buildOpenApiDocument } from "./document"

const API_DIR = path.join(process.cwd(), "app", "api")
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const

/** Domínios já no padrão: toda rota deles precisa estar no documento. */
const documentedDomains = ["quiz"]

/** Rotas de infraestrutura da própria documentação. */
const ignoredDomains = ["openapi"]

/**
 * Domínios que ainda não migraram. Esta lista só pode encolher: ao documentar
 * um domínio, mova-o para `documentedDomains`.
 */
const pendingDomains = [
  "admin", "ai", "appointments", "assistant", "auth", "calendar", "chat",
  "community", "contact", "cron", "cv", "dashboard", "diagnostic",
  "feature-flags", "feedback", "invites", "mcp", "me", "mentors", "org",
  "profile", "reports", "suggestions", "upload",
]

function routeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return routeFiles(full)
    return entry.name === "route.ts" ? [full] : []
  })
}

/** app/api/quiz/[id]/account/route.ts -> /api/quiz/{id}/account */
function toOpenApiPath(file: string): string {
  const rel = path.relative(path.join(process.cwd(), "app"), path.dirname(file))
  return "/" + rel.split(path.sep).join("/").replace(/\[([^\]]+)\]/g, "{$1}")
}

function exportedMethods(file: string): string[] {
  const source = fs.readFileSync(file, "utf-8")
  return METHODS.filter((m) => new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\b`).test(source))
}

const doc = buildOpenApiDocument()

describe("OpenAPI document", () => {
  it("is an OpenAPI 3.1 document and every operation declares responses", () => {
    expect(doc.openapi).toBe("3.1.0")
    for (const [route, item] of Object.entries(doc.paths ?? {})) {
      for (const [method, operation] of Object.entries(item as Record<string, { responses?: object }>)) {
        expect({ route, method, hasResponses: Object.keys(operation.responses ?? {}).length > 0 }).toEqual({
          route,
          method,
          hasResponses: true,
        })
      }
    }
  })

  it.each(documentedDomains)("every route of %s is documented, and nothing is documented without a route", (domain) => {
    const expected = routeFiles(path.join(API_DIR, domain)).flatMap((file) =>
      exportedMethods(file).map((m) => `${m.toLowerCase()} ${toOpenApiPath(file)}`)
    )
    const documented = Object.entries(doc.paths ?? {})
      .filter(([route]) => route.startsWith(`/api/${domain}`))
      .flatMap(([route, item]) => Object.keys(item as object).map((m) => `${m} ${route}`))

    expect(documented.sort()).toEqual(expected.sort())
  })

  it("every api domain is documented, pending or ignored, and pending only shrinks", () => {
    const onDisk = fs.readdirSync(API_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    const known = [...documentedDomains, ...pendingDomains, ...ignoredDomains]

    expect(onDisk.filter((d) => !known.includes(d))).toEqual([]) // domínio novo sem decisão
    expect(pendingDomains.filter((d) => !onDisk.includes(d))).toEqual([]) // pendente que não existe mais
  })
})
