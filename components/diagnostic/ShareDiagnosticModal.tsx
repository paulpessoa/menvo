"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Share2, Check, X, Shield, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DiagnosticShareWithMentor, DiagnosticShareScope } from "@/lib/types/models/diagnostic-shares"

interface SuggestedMentorItem {
  mentor_nome?: string
  tipo: string
  razao: string
}

interface ShareDiagnosticModalProps {
  isOpen: boolean
  onClose: () => void
  quizResponseId?: string
  diagnosticSessionId?: string
  suggestedMentors?: SuggestedMentorItem[]
  mentorSlugMap?: Record<string, string>
}

/**
 * Modal to manage diagnostic sharing with mentors.
 * Allows mentees to share results with suggested mentors and revoke access at any time.
 */
export function ShareDiagnosticModal({
  isOpen,
  onClose,
  quizResponseId,
  diagnosticSessionId,
  suggestedMentors = [],
  mentorSlugMap = {}
}: ShareDiagnosticModalProps) {
  const { toast } = useToast()
  const [scope, setScope] = useState<DiagnosticShareScope>("summary")
  const [activeShares, setActiveShares] = useState<DiagnosticShareWithMentor[]>([])
  const [loadingShares, setLoadingShares] = useState(false)
  const [sharingMentorId, setSharingMentorId] = useState<string | null>(null)
  const [revokingShareId, setRevokingShareId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && (quizResponseId || diagnosticSessionId)) {
      loadShares()
    }
  }, [isOpen, quizResponseId, diagnosticSessionId])

  const loadShares = async () => {
    setLoadingShares(true)
    try {
      const params = new URLSearchParams()
      if (quizResponseId) params.append("quizResponseId", quizResponseId)
      if (diagnosticSessionId) params.append("diagnosticSessionId", diagnosticSessionId)

      const res = await fetch(`/api/diagnostic/shares?${params.toString()}`)
      if (!res.ok) throw new Error("Erro ao carregar compartilhamentos")
      const data = await res.json()
      setActiveShares(data.shares || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingShares(false)
    }
  }

  const handleShareWithMentor = async (mentorId: string, mentorName: string) => {
    setSharingMentorId(mentorId)
    try {
      const res = await fetch("/api/diagnostic/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: mentorId,
          quiz_response_id: quizResponseId || null,
          diagnostic_session_id: diagnosticSessionId || null,
          scope
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao compartilhar")

      toast({
        title: "Diagnóstico compartilhado",
        description: `Seu diagnóstico foi compartilhado com ${mentorName}.`
      })

      await loadShares()
    } catch (err: any) {
      toast({
        title: "Erro ao compartilhar",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSharingMentorId(null)
    }
  }

  const handleRevokeShare = async (shareId: string, mentorName: string) => {
    setRevokingShareId(shareId)
    try {
      const res = await fetch(`/api/diagnostic/shares/${shareId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Erro ao revogar acesso")

      toast({
        title: "Acesso revogado",
        description: `O acesso do mentor ${mentorName} foi revogado.`
      })

      await loadShares()
    } catch (err: any) {
      toast({
        title: "Erro ao revogar",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setRevokingShareId(null)
    }
  }

  const activeMentorIds = new Set(
    activeShares.filter((s) => !s.revoked_at).map((s) => s.mentor_id)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Share2 className="h-5 w-5" />
            <DialogTitle className="text-xl">Compartilhar Diagnóstico com Mentor</DialogTitle>
          </div>
          <DialogDescription>
            Conceda acesso aos insights do seu diagnóstico para que o mentor possa preparar e enriquecer suas sessões.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Privacy Scope Selector */}
          <div className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Nível de Compartilhamento</span>
            </div>
            <RadioGroup
              value={scope}
              onValueChange={(val) => setScope(val as DiagnosticShareScope)}
              className="space-y-2"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="summary" id="scope-summary" className="mt-1" />
                <Label htmlFor="scope-summary" className="text-xs cursor-pointer leading-relaxed">
                  <span className="font-semibold text-foreground">Resumo Executivo (Recomendado)</span>
                  <p className="text-muted-foreground">
                    Inclui objetivos, áreas de desenvolvimento, desafios e conselhos práticos. Respostas sobre vida pessoal ficam estritamente ocultas.
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="full" id="scope-full" className="mt-1" />
                <Label htmlFor="scope-full" className="text-xs cursor-pointer leading-relaxed">
                  <span className="font-semibold text-foreground">Completo</span>
                  <p className="text-muted-foreground">
                    Inclui todos os insights gerados e contexto fornecido no diagnóstico.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mentores Sugeridos */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Mentores Recomendados para seu Momento
            </h4>
            {suggestedMentors.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum mentor sugerido diretamente neste resultado.</p>
            ) : (
              <div className="space-y-2">
                {suggestedMentors.map((m, idx) => {
                  const mentorName = m.mentor_nome || m.tipo
                  const mentorId = m.mentor_nome ? mentorSlugMap[m.mentor_nome.toLowerCase()] : null
                  const isShared = mentorId ? activeMentorIds.has(mentorId) : false
                  const isSharing = mentorId === sharingMentorId

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <p className="font-medium text-sm leading-none">{mentorName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.razao}</p>
                      </div>

                      {mentorId ? (
                        isShared ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Compartilhado
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isSharing}
                            onClick={() => handleShareWithMentor(mentorId, mentorName)}
                            className="rounded-xl active:scale-[0.98]"
                          >
                            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compartilhar"}
                          </Button>
                        )
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {m.tipo}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Compartilhamentos Ativos com opção de Revogação */}
          {activeShares.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Mentores com Acesso Ativo</h4>
                {loadingShares ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeShares.map((share) => {
                      const isRevoking = share.id === revokingShareId
                      const isRevoked = Boolean(share.revoked_at)

                      return (
                        <div
                          key={share.id}
                          className="flex items-center justify-between p-3 rounded-xl border bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={share.mentor?.avatar_url || undefined} />
                              <AvatarFallback>{share.mentor?.full_name?.slice(0, 2).toUpperCase() || "ME"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{share.mentor?.full_name}</p>
                              <span className="text-xs text-muted-foreground">
                                {isRevoked ? "Acesso revogado" : `Acesso: ${share.scope === "summary" ? "Resumo" : "Completo"}`}
                              </span>
                            </div>
                          </div>

                          {!isRevoked && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isRevoking}
                              onClick={() => handleRevokeShare(share.id, share.mentor?.full_name || "Mentor")}
                              className="text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              {isRevoking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revogar"}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
