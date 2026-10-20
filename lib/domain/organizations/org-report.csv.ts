/**
 * Camada 3 · Entity (organizações) · relatório de impacto em CSV
 * Regra: monta o texto do CSV que o admin da org baixa, a partir do que o
 * dashboard já tem na mão. Função pura: sem DOM, sem fetch, sem data implícita
 * (a data de emissão entra por parâmetro, para o teste ser estável).
 * Não faz: o download (Blob + link) nem toast; isso é da UI.
 * Tradeoff: o texto é montado no navegador, sem rota nova. Em troca, o CSV
 * reflete exatamente o que está na tela (mesmo período, mesmos números).
 * O cabeçalho do relatório (nome, período) segue o formato histórico, com
 * valores entre aspas; só as linhas de membros escapam aspas internas.
 */
import type { OrgDashboardMember, OrgDashboardSummary, OrgPeriod } from "./organization.entity"

export const PERIOD_LABELS: Record<OrgPeriod, string> = {
  all: "Todo o período",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "1y": "Último ano",
}

const STATUS_LABELS: Record<OrgDashboardMember["status"], string> = {
  invited: "Convidado",
  requested: "Solicitado",
  active: "Ativo",
}

const quote = (value: string | null | undefined) => `"${(value || "").replace(/"/g, '""')}"`

export interface OrgImpactCsvInput {
  orgName: string
  period: OrgPeriod
  summary: OrgDashboardSummary
  members: readonly OrgDashboardMember[]
  /** Data de emissão; o chamador passa `new Date()`. */
  issuedAt: Date
}

/** Texto completo do CSV (com BOM, para o Excel abrir acentos certo; linhas separadas por CRLF). */
export function buildOrgImpactCsv({ orgName, period, summary, members, issuedAt }: OrgImpactCsvInput): string {
  const impact = summary.impact
  const lines: string[] = [
    `Relatório de Impacto - Organização: "${orgName}"`,
    `Período: "${PERIOD_LABELS[period] || period}"`,
    `Data de Emissão: "${issuedAt.toLocaleDateString("pt-BR")}"`,
    `Sessões Concluídas: "${impact?.totalSessionsCompleted ?? 0}"`,
    `Horas de Mentoria: "${impact?.totalHoursCompleted ?? 0}h"`,
    `Diagnósticos Realizados: "${impact?.totalDiagnosticsDone ?? 0}"`,
    `Nota Média: "${impact?.averageRating ? impact.averageRating.toFixed(1) : "N/A"}"`,
    "",
    "Nome,E-mail,Papel na Organização,Perfil Plataforma,Status,Sessões Solicitadas,Sessões Ministradas,Diagnóstico Concluído,Data de Entrada",
  ]

  for (const m of members) {
    lines.push(
      [
        quote(m.fullName),
        quote(m.email),
        quote(m.role === "admin" ? "Admin" : "Membro"),
        quote(m.platformRole === "mentor" ? "Mentor" : "Beneficiário"),
        quote(STATUS_LABELS[m.status]),
        m.sessionsBooked,
        m.sessionsGiven,
        quote(m.quizDone ? "Sim" : "Não"),
        quote(m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("pt-BR") : ""),
      ].join(",")
    )
  }

  return "﻿" + lines.join("\r\n")
}

/** Nome do arquivo baixado, no formato que o relatório sempre teve. */
export function orgImpactCsvFilename(orgSlug: string, period: OrgPeriod): string {
  return `relatorio-impacto-${orgSlug}-${period}.csv`
}
