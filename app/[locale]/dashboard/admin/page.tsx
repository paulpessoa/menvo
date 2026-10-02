"use client"

import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { MenvoDots } from "@/components/ui/menvo-loader"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AttentionPanel } from "@/components/admin/overview/AttentionPanel"
import { OverviewKpis } from "@/components/admin/overview/OverviewKpis"
import { AdminSectionNav } from "@/components/admin/overview/AdminSectionNav"
import { fetchAdminOverview } from "@/lib/services/admin/overview.client"

const OverviewCharts = dynamic(
  () => import("@/components/admin/overview/OverviewCharts").then(mod => mod.OverviewCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-[340px] animate-pulse rounded-lg bg-muted/40" />
        <div className="h-[340px] animate-pulse rounded-lg bg-muted/40" />
      </div>
    )
  }
)

/**
 * Admin home: what needs a decision now, the health KPIs, the strategic
 * charts from every admin area, and the index of admin pages. All numbers
 * come from one aggregated call (GET /api/admin/overview).
 */
export default function AdminDashboard() {
  const { profile } = useAuth()
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchAdminOverview,
    staleTime: 60_000
  })

  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <AdminPageHeader
          showBack={false}
          title="Painel administrativo"
          description={`${firstName ? `Olá, ${firstName}. ` : ""}Visão estratégica da Menvo nas últimas 12 semanas.`}
          actions={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Atualizando..." : "Atualizar"}
            </Button>
          }
        />

        <div className="space-y-10">
          {isLoading && (
            <div className="flex justify-center py-16">
              <MenvoDots />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Não foi possível carregar os indicadores. Tente atualizar em instantes.
            </p>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <OverviewKpis data={data} />
                </div>
                <AttentionPanel data={data} />
              </div>
              <OverviewCharts data={data} />
            </>
          )}

          <AdminSectionNav />
        </div>
      </PageContainer>
    </RequireRole>
  )
}
