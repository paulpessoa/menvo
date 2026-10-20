import { toast } from "sonner"
import type {
  OrgDashboardMember,
  OrgDashboardSummary,
  OrgPeriod,
} from "@/lib/domain/organizations/organization.entity"
import { buildOrgImpactCsv, orgImpactCsvFilename } from "@/lib/domain/organizations/org-report.csv"
import { downloadCsv } from "./downloadCsv"
import { ImpactCards } from "./ImpactCards"
import { ImpactToolbar } from "./ImpactToolbar"

interface ImpactSectionProps {
  organization: { name: string; slug: string }
  period: OrgPeriod
  onPeriodChange: (period: OrgPeriod) => void
  summary: OrgDashboardSummary | undefined
  members: readonly OrgDashboardMember[]
}

/** Relatório de Impacto: filtro de período, exportação em CSV e os quatro números. */
export function ImpactSection({ organization, period, onPeriodChange, summary, members }: ImpactSectionProps) {
  const exportCsv = () => {
    if (!summary) return
    const csv = buildOrgImpactCsv({ orgName: organization.name, period, summary, members, issuedAt: new Date() })
    downloadCsv(orgImpactCsvFilename(organization.slug, period), csv)
    toast.success("Relatório CSV exportado com sucesso!")
  }

  return (
    <div className="mb-6 space-y-4">
      <ImpactToolbar
        period={period}
        onPeriodChange={onPeriodChange}
        onExport={exportCsv}
        exportDisabled={!summary || members.length === 0}
      />
      {summary?.impact && <ImpactCards impact={summary.impact} />}
    </div>
  )
}
