import { Link } from "@/i18n/routing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminOverview } from "@/lib/services/admin/overview.types"
import { formatInt, formatPercent } from "./chart-theme"

interface AttentionPanelProps {
  data: AdminOverview
}

/** Share of the AI budget past which the dashboard starts flagging spend. */
const AI_BUDGET_ALERT = 0.8

/**
 * The work queue: only items that need a human decision now, each linking to
 * the page where it gets done. Empty items are hidden instead of showing zeros.
 */
export function AttentionPanel({ data }: AttentionPanelProps) {
  const budgetUse = data.ai.budgetUsd ? data.ai.spentUsd / data.ai.budgetUsd : 0
  const items = [
    { count: data.mentorPipeline.pending, label: "candidaturas de mentor aguardando análise", href: "/dashboard/admin/verifications" },
    { count: data.ratings.pendingModeration, label: "avaliações de sessão aguardando moderação", href: "/dashboard/admin/feedbacks" },
    { count: data.organizations.leadsNew, label: "organizações interessadas sem contato", href: "/dashboard/admin/organizations?tab=leads" },
    { count: data.retention.deletionsNext7d, label: "contas com exclusão LGPD nos próximos 7 dias", href: "/dashboard/admin/retention" }
  ].filter(item => item.count > 0)

  const showBudget = budgetUse >= AI_BUDGET_ALERT

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pendências</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && !showBudget ? (
          <p className="text-sm text-muted-foreground">Nada aguardando decisão agora.</p>
        ) : (
          <ul className="divide-y">
            {items.map(item => (
              <li key={item.href} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span>
                  <span className="font-semibold tabular-nums">{formatInt(item.count)}</span> {item.label}
                </span>
                <Link href={item.href} className="shrink-0 font-medium text-primary hover:underline">
                  Revisar
                </Link>
              </li>
            ))}
            {showBudget && (
              <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span>
                  <span className="font-semibold tabular-nums">{formatPercent(budgetUse)}</span> do teto mensal de IA já consumido
                </span>
                <Link href="/dashboard/admin/ai-usage" className="shrink-0 font-medium text-primary hover:underline">
                  Revisar
                </Link>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
