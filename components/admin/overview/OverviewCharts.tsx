"use client"

import type { AdminOverview } from "@/lib/services/admin/overview.types"
import { AiSpendChart } from "./AiSpendChart"
import { BarList } from "./BarList"
import { ChartCard } from "./ChartCard"
import { StackedWeeklyChart } from "./StackedWeeklyChart"
import { SERIES, formatInt, formatUsd } from "./chart-theme"

interface OverviewChartsProps {
  data: AdminOverview
}

/** Max AI features listed before the rest would just be noise next to the top spenders. */
const TOP_FEATURES = 6

/**
 * Chart grid of /dashboard/admin, grouped by the decision each block informs:
 * demand and supply growth, quality of the offer, and cost/compliance.
 * Loaded client-only (recharts measures the DOM).
 */
export function OverviewCharts({ data }: OverviewChartsProps) {
  const { mentorPipeline, ratings, organizations, retention, ai } = data

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Crescimento e uso</h2>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            title="Novos cadastros por semana"
            description="Equilíbrio entre demanda (mentorados) e oferta (mentores aprovados) nas últimas 12 semanas."
            href="/dashboard/admin/users"
          >
            <StackedWeeklyChart
              data={data.signupsByWeek}
              series={[
                { key: "mentees", label: "Mentorados", color: SERIES.primary },
                { key: "mentors", label: "Mentores", color: SERIES.tertiary },
                { key: "other", label: "Sem papel definido", color: SERIES.muted }
              ]}
            />
          </ChartCard>
          <ChartCard
            title="Pedidos de sessão por semana"
            description="O que acontece com cada pedido: realizado, agendado, sem resposta ou cancelado."
            href="/dashboard/admin/appointments"
          >
            <StackedWeeklyChart
              data={data.sessions.byWeek}
              series={[
                { key: "done", label: "Realizadas", color: SERIES.primary },
                { key: "scheduled", label: "Agendadas", color: SERIES.secondary },
                { key: "pending", label: "Sem resposta", color: SERIES.tertiary },
                { key: "cancelled", label: "Canceladas", color: SERIES.muted }
              ]}
            />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Qualidade da oferta</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Candidaturas de mentor" description="Fila de verificação e histórico de decisões." href="/dashboard/admin/verifications">
            <BarList
              items={[
                { label: "Aguardando análise", value: mentorPipeline.pending },
                { label: "Aprovadas", value: mentorPipeline.approved },
                { label: "Recusadas", value: mentorPipeline.rejected, muted: true }
              ]}
            />
          </ChartCard>
          <ChartCard title="Distribuição das notas" description="Avaliações que mentorados deram às sessões." href="/dashboard/admin/feedbacks">
            <BarList
              items={ratings.distribution.map(r => ({ label: `${r.stars} ${r.stars === 1 ? "estrela" : "estrelas"}`, value: r.count, muted: r.stars <= 2 }))}
              emptyMessage="Nenhuma avaliação registrada."
            />
          </ChartCard>
          <ChartCard title="Organizações" description="Parceiras ativas e funil de organizações interessadas." href="/dashboard/admin/organizations">
            <BarList
              items={[
                { label: "Parceiras ativas", value: organizations.active },
                { label: "Interessadas sem contato", value: organizations.leadsNew },
                { label: "Em conversa", value: organizations.leadsContacted },
                { label: "Encerradas", value: organizations.leadsClosed, muted: true }
              ]}
            />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Custos e conformidade</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Gasto com IA no mês" description="Acumulado diário contra o teto mensal." href="/dashboard/admin/ai-usage">
            <AiSpendChart ai={ai} />
          </ChartCard>
          <ChartCard title="Gasto com IA por funcionalidade" description="Onde o dinheiro de IA vai neste mês." href="/dashboard/admin/ai-usage">
            <BarList
              items={ai.byFeature.slice(0, TOP_FEATURES).map(f => ({
                label: `${f.feature} · ${formatInt(f.calls)} chamadas`,
                value: f.costUsd,
                display: formatUsd(f.costUsd)
              }))}
              emptyMessage="Nenhuma chamada de IA neste mês."
            />
          </ChartCard>
          <ChartCard title="Retenção LGPD" description="Contas em cada etapa da exclusão automática." href="/dashboard/admin/retention">
            <BarList
              items={[
                { label: "Importadas, aguardando prazo", value: retention.waiting },
                { label: "Aviso de 30 dias enviado", value: retention.notice30d },
                { label: "Aviso de 1 dia enviado", value: retention.notice1d },
                { label: "Opt-out (sem avisos)", value: retention.optedOut, muted: true },
                { label: "Inativas há 1 ano, avisadas", value: retention.inactiveNotified }
              ]}
              emptyMessage="Nenhuma conta na fila de exclusão."
            />
          </ChartCard>
        </div>
      </section>
    </div>
  )
}
