"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AiUsageReport } from "@/lib/services/ai/ai-usage.service"

const usd = (v: number) => `US$ ${v.toFixed(v < 1 ? 4 : 2)}`
const int = (v: number) => v.toLocaleString("pt-BR")

async function fetchReport(month: string): Promise<AiUsageReport> {
  const res = await fetch(`/api/admin/ai-usage?month=${month}`)
  if (!res.ok) throw new Error("Falha ao carregar uso de IA")
  return res.json()
}

/**
 * Where AI money goes, per month: by feature × model (incl. error/fallback
 * rate and unpriced calls) and the top users by cost (abuse detection).
 */
export default function AdminAIUsagePage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-ai-usage", month],
    queryFn: () => fetchReport(month)
  })

  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Custos de IA</h1>
              <p className="text-muted-foreground text-lg">Cada chamada de modelo, medida em tokens e dólares.</p>
            </div>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full sm:w-44" />
          </div>

          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          {error && <p className="text-destructive">Não foi possível carregar o relatório.</p>}

          {data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat
                  label={data.budgetUsd === null ? "Custo no mês" : `Custo no mês (teto ${usd(data.budgetUsd)})`}
                  value={usd(data.totals.costUsd)}
                />
                <Stat label="Chamadas de modelo" value={int(data.totals.calls)} />
                <Stat label="Erros / fallbacks" value={`${int(data.totals.errors)} / ${int(data.totals.fallbacks)}`} />
                <Stat label="Chamadas sem preço" value={int(data.totals.unpricedCalls)} />
              </div>

              <Card>
                <CardHeader><CardTitle>Por funcionalidade e modelo</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionalidade</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Usuários</TableHead>
                        <TableHead className="text-right">Tokens (in / out)</TableHead>
                        <TableHead className="text-right">p50</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byModel.map((r) => (
                        <TableRow key={`${r.feature}-${r.provider}-${r.model}`}>
                          <TableCell className="font-medium">{r.feature}</TableCell>
                          <TableCell>{r.provider}/{r.model}</TableCell>
                          <TableCell className="text-right">{int(r.calls)}</TableCell>
                          <TableCell className="text-right">{int(r.users)}</TableCell>
                          <TableCell className="text-right">{int(r.input_tokens)} / {int(r.output_tokens)}</TableCell>
                          <TableCell className="text-right">{r.p50_latency_ms ? `${int(r.p50_latency_ms)}ms` : "—"}</TableCell>
                          <TableCell className="text-right">{usd(r.cost_usd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Top 20 usuários por custo</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      {data.topUsers.map((u) => (
                        <TableRow key={u.user_id ?? "anon"}>
                          <TableCell>{u.full_name ?? u.user_id ?? "—"}</TableCell>
                          <TableCell className="text-right">{int(u.calls)} chamadas</TableCell>
                          <TableCell className="text-right">{usd(u.cost_usd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageContainer>
    </RequireRole>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}
