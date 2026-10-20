import { buildOrgImpactCsv, orgImpactCsvFilename } from "./org-report.csv"
import type { OrgDashboardMember, OrgDashboardSummary } from "./organization.entity"

const summary: OrgDashboardSummary = {
  beneficiaries: 1,
  mentors: 1,
  pendingRequests: 0,
  pendingInvites: 0,
  sessionsBookedByBeneficiaries: 2,
  sessionsGivenByOrgMentors: 3,
  impact: { period: "30d", totalSessionsCompleted: 5, totalHoursCompleted: 3.5, totalDiagnosticsDone: 2, averageRating: 4.5 },
}

function member(over: Partial<OrgDashboardMember>): OrgDashboardMember {
  return {
    userId: "u",
    role: "member",
    status: "active",
    platformRole: "mentee",
    joinedAt: "2026-03-15T12:00:00.000Z",
    fullName: "Ana",
    email: "ana@x.org",
    sessionsBooked: 2,
    sessionsGiven: 0,
    quizDone: true,
    ...over,
  }
}

const issuedAt = new Date("2026-10-19T12:00:00.000Z")

describe("buildOrgImpactCsv", () => {
  it("starts with a BOM and uses CRLF between lines", () => {
    const csv = buildOrgImpactCsv({ orgName: "Giral", period: "30d", summary, members: [], issuedAt })
    expect(csv.startsWith("﻿")).toBe(true)
    expect(csv).toContain("\r\n")
    expect(csv).not.toMatch(/[^\r]\n/)
  })

  it("writes the report header with period label, issue date and impact numbers", () => {
    const [head] = buildOrgImpactCsv({ orgName: "Giral", period: "30d", summary, members: [], issuedAt }).split("\r\n")
    expect(head).toBe('﻿Relatório de Impacto - Organização: "Giral"')
    const lines = buildOrgImpactCsv({ orgName: "Giral", period: "30d", summary, members: [], issuedAt }).split("\r\n")
    expect(lines.slice(1, 7)).toEqual([
      'Período: "Últimos 30 dias"',
      `Data de Emissão: "${issuedAt.toLocaleDateString("pt-BR")}"`,
      'Sessões Concluídas: "5"',
      'Horas de Mentoria: "3.5h"',
      'Diagnósticos Realizados: "2"',
      'Nota Média: "4.5"',
    ])
    expect(lines[7]).toBe("")
  })

  it('prints "N/A" when there is no rating', () => {
    const noRating = { ...summary, impact: { ...summary.impact, averageRating: null } }
    const csv = buildOrgImpactCsv({ orgName: "G", period: "all", summary: noRating, members: [], issuedAt })
    expect(csv).toContain('Nota Média: "N/A"')
  })

  it("writes one row per member with role, platform profile and status labels", () => {
    const csv = buildOrgImpactCsv({
      orgName: "G",
      period: "all",
      summary,
      issuedAt,
      members: [
        member({}),
        member({ userId: "m", role: "admin", platformRole: "mentor", status: "invited", sessionsGiven: 4, quizDone: false, fullName: null }),
      ],
    })
    const rows = csv.split("\r\n").slice(9)
    expect(rows[0]).toBe(`"Ana","ana@x.org","Membro","Beneficiário","Ativo",2,0,"Sim","${new Date("2026-03-15T12:00:00.000Z").toLocaleDateString("pt-BR")}"`)
    expect(rows[1]).toMatch(/^"","ana@x.org","Admin","Mentor","Convidado",2,4,"Não",/)
  })

  it("doubles quotes inside member fields", () => {
    const csv = buildOrgImpactCsv({
      orgName: "G",
      period: "all",
      summary,
      issuedAt,
      members: [member({ fullName: 'Ana "Nana" Silva' })],
    })
    expect(csv).toContain('"Ana ""Nana"" Silva"')
  })
})

describe("orgImpactCsvFilename", () => {
  it("keeps the historical file name", () => {
    expect(orgImpactCsvFilename("giral", "90d")).toBe("relatorio-impacto-giral-90d.csv")
  })
})
