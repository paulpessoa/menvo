"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Sparkles, Calendar, ArrowUpRight, Compass, Shield } from "lucide-react"
import { SharedDiagnosticViewerModal } from "./SharedDiagnosticViewerModal"
import type { SharedDiagnosticInsight } from "@/lib/types/models/diagnostic-shares"

/**
 * Section that renders the list of diagnostic insights shared with a mentor.
 */
export function SharedDiagnosticsSection() {
  const [shares, setShares] = useState<SharedDiagnosticInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInsight, setSelectedInsight] = useState<SharedDiagnosticInsight | null>(null)

  const loadShares = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/diagnostic/shares?role=mentor")
      if (!res.ok) throw new Error("Erro ao carregar compartilhamentos")
      const data = await res.json()
      setShares(data.shares || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShares()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Carregando diagnósticos compartilhados...</p>
      </div>
    )
  }

  if (shares.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-4 py-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="font-semibold text-base">Nenhum diagnóstico compartilhado ainda</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Quando seus mentorados decidirem compartilhar os resultados do diagnóstico de carreira com você, os insights aparecerão aqui para ajudar na preparação das suas sessões.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Diagnósticos Compartilhados</h3>
          <p className="text-sm text-muted-foreground">
            Insights de carreira e desenvolvimento concedidos pelos seus mentorados.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadShares} className="rounded-xl">
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shares.map((share) => {
          const dateStr = new Date(share.createdAt).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })

          return (
            <Card
              key={share.shareId}
              className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow"
              onClick={() => setSelectedInsight(share)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={share.mentee.avatarUrl || undefined} />
                      <AvatarFallback>
                        {share.mentee.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {share.mentee.fullName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>Compartilhado em {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs bg-muted/30">
                    {share.scope === "summary" ? "Resumo" : "Completo"}
                  </Badge>
                </div>

                {share.analysis?.titulo_personalizado && (
                  <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-muted">
                    <p className="text-xs font-semibold text-primary line-clamp-1">
                      {share.analysis.titulo_personalizado}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {share.analysis.resumo_motivador}
                    </p>
                  </div>
                )}

                {share.developmentAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {share.developmentAreas.slice(0, 3).map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[11px] font-normal">
                        {area}
                      </Badge>
                    ))}
                    {share.developmentAreas.length > 3 && (
                      <Badge variant="outline" className="text-[11px]">
                        +{share.developmentAreas.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-primary font-medium">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Visualização de Insights
                  </span>
                  <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Ver Diagnóstico
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SharedDiagnosticViewerModal
        isOpen={Boolean(selectedInsight)}
        onClose={() => setSelectedInsight(null)}
        insight={selectedInsight}
      />
    </div>
  )
}
