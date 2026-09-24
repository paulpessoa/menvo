"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sparkles,
  Shield,
  Target,
  Compass,
  CheckCircle2,
  Lightbulb,
  Heart
} from "lucide-react"
import type { SharedDiagnosticInsight } from "@/lib/types/models/diagnostic-shares"

interface SharedDiagnosticViewerModalProps {
  isOpen: boolean
  onClose: () => void
  insight: SharedDiagnosticInsight | null
}

/**
 * Read-only modal for mentors to review shared diagnostic insights of a mentee.
 * Respects strict privacy scoping (omits personal life unless scope is 'full').
 */
export function SharedDiagnosticViewerModal({
  isOpen,
  onClose,
  insight
}: SharedDiagnosticViewerModalProps) {
  if (!insight) return null

  const analysis = insight.analysis

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl">Diagnóstico de Carreira</DialogTitle>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {insight.scope === "summary" ? "Resumo de Insights" : "Diagnóstico Completo"}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Compartilhado com consentimento exclusivo para esta mentoria.</span>
          </DialogDescription>
        </DialogHeader>

        {/* Mentee Header */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={insight.mentee.avatarUrl || undefined} />
            <AvatarFallback>{insight.mentee.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-sm">{insight.mentee.fullName}</h4>
            <p className="text-xs text-muted-foreground">
              Compartilhado em {new Date(insight.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          {/* Custom Title & Motivator */}
          {analysis && (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-primary">
                {analysis.titulo_personalizado}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.resumo_motivador}
              </p>
            </div>
          )}

          {/* Development Areas */}
          {insight.developmentAreas.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                Áreas de Desenvolvimento Prioritárias
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {insight.developmentAreas.map((area, idx) => (
                  <Badge key={idx} variant="secondary" className="rounded-lg text-xs font-medium">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Current Challenge & Future Vision */}
          {(insight.currentChallenge || insight.futureVision) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insight.currentChallenge && (
                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-amber-600" />
                    Desafio Atual
                  </span>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap">{insight.currentChallenge}</p>
                </div>
              )}
              {insight.futureVision && (
                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
                    Visão de Futuro
                  </span>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap">{insight.futureVision}</p>
                </div>
              )}
            </div>
          )}

          {/* Practical Advice */}
          {analysis?.conselhos_praticos && analysis.conselhos_praticos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Conselhos Práticos Sugeridos pela IA
              </h4>
              <ul className="space-y-2">
                {analysis.conselhos_praticos.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border">
                    <span className="text-primary font-bold">{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {analysis?.proximos_passos && analysis.proximos_passos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-purple-600" />
                Próximos Passos
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.proximos_passos.map((passo, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-normal border-dashed">
                    {passo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Personal life if full scope */}
          {insight.scope === "full" && insight.personalLifeHelp && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-red-500" />
                Contexto Adicional Compartilhado
              </span>
              <p className="text-xs text-amber-900/90 dark:text-amber-100 whitespace-pre-wrap">
                {insight.personalLifeHelp}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={onClose} className="rounded-xl w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
