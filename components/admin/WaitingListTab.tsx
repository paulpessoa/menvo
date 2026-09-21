"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserPlus, Sparkles, FileQuestion, ChevronDown, ChevronUp, ListChecks, CheckCircle2, MessageCircle, Copy } from "lucide-react"
import { toast } from "sonner"

function formatWhatsappDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  // Assume BR numbers already missing the country code are 10-11 digits (DDD + number)
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits
  return digits
}

interface WaitingListEntry {
  id: string
  name: string
  email: string
  whatsapp: string | null
  reason: string | null
  status: string
  created_at: string
  has_profile: boolean
}

interface MatchSuggestion {
  mentor_id: string
  mentor_name: string
  mentor_email: string | null
  mentor_title: string | null
  reason: string
}

interface MatchResult {
  suggestions: MatchSuggestion[]
  global_justification: string
  no_match?: boolean
  error?: string
}

export function WaitingListTab() {
  const [entries, setEntries] = useState<WaitingListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({})

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/waiting-list")
      if (!response.ok) throw new Error("Erro ao carregar lista de espera")
      const result = await response.json()
      setEntries(result.data || [])
    } catch (error) {
      console.error("Error fetching waiting list:", error)
      toast.error("Erro ao carregar lista de espera")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleCreateAccount = async (id: string) => {
    setPendingAction(`create-account-${id}`)
    try {
      const response = await fetch("/api/admin/waiting-list/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitingListId: id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Falha ao criar conta e enviar convite")
      toast.success(
        data.accountCreated
          ? "Conta criada e convite enviado!"
          : "Convite enviado para a conta já existente!"
      )
      setEntries(prev => prev.map(e => (e.id === id ? { ...e, status: "invited", has_profile: true } : e)))
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta e enviar convite")
    } finally {
      setPendingAction(null)
    }
  }

  const handleRequestInfo = async (id: string) => {
    setPendingAction(`request-info-${id}`)
    try {
      const response = await fetch("/api/admin/waiting-list/request-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitingListId: id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Falha ao enviar e-mail")
      toast.success("E-mail solicitando perfil/quiz enviado!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar e-mail")
    } finally {
      setPendingAction(null)
    }
  }

  const handleMatch = async (id: string) => {
    setPendingAction(`match-${id}`)
    try {
      const response = await fetch("/api/admin/waiting-list/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitingListId: id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Falha ao gerar match")
      setMatchResults(prev => ({ ...prev, [id]: data }))
      setExpandedId(id)
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar match")
    } finally {
      setPendingAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando lista de espera...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium">Nenhum registro na lista de espera</h3>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {entries.map((entry) => {
        const hasReason = Boolean(entry.reason && entry.reason.trim())
        const isExpanded = expandedId === entry.id
        const match = matchResults[entry.id]
        
        const createdDate = new Date(entry.created_at)
        const daysWaiting = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        const formattedDate = createdDate.toLocaleDateString('pt-BR')

        return (
          <div key={entry.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{entry.name}</span>
                  {/* Quem já entrou de fato nem aparece aqui (vira 'registered'),
                      então ter perfil sem convite significa conta criada mas
                      nunca acessada — vale um lembrete em vez de um novo cadastro. */}
                  {entry.has_profile && entry.status !== "invited" && (
                    <Badge variant="outline" className="text-[10px] uppercase text-amber-700 border-amber-300 bg-amber-50">
                      Tem conta, nunca entrou
                    </Badge>
                  )}
                  {!hasReason && (
                    <Badge variant="outline" className="text-[10px] uppercase text-orange-700 border-orange-300 bg-orange-50">
                      Sem motivação preenchida
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{entry.email}</span>
                  <span className="opacity-50">•</span>
                  <span>Cadastrado em: {formattedDate} ({daysWaiting} {daysWaiting === 1 ? 'dia' : 'dias'} aguardando)</span>
                </div>
                {entry.whatsapp && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">WhatsApp: {entry.whatsapp}</span>
                    {(() => {
                      const waDigits = formatWhatsappDigits(entry.whatsapp!)
                      if (!waDigits) return null
                      const waMessage = `Olá ${entry.name.split(" ")[0]}! Aqui é da Menvo 🙂 Vi que você está na nossa lista de espera e gostaria de conversar sobre os próximos passos.`
                      const waLink = `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`
                      return (
                        <>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline"
                            title="Abrir conversa no WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" /> Abrir WhatsApp
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(waDigits)
                              toast.success("Número copiado!")
                            }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            title="Copiar número"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </>
                      )
                    })()}
                  </div>
                )}
                {hasReason && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? "Ocultar motivação" : "Ver motivação"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {entry.status === "invited" && (
                  <Badge variant="outline" className="h-9 px-3 flex items-center gap-1.5 text-green-700 border-green-300 bg-green-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Convite enviado
                  </Badge>
                )}
                {/* Quem já foi convidado continua podendo receber um novo link:
                    o link do Supabase é de uso único e expira em horas, então
                    é comum a pessoa abrir, não salvar a senha e precisar de outro. */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateAccount(entry.id)}
                  disabled={pendingAction === `create-account-${entry.id}`}
                  className="gap-1.5"
                  title={
                    entry.status === "invited"
                      ? "Gera um novo link de definição de senha e reenvia o e-mail de convite"
                      : entry.has_profile
                        ? "Esta pessoa já tem conta — enviaremos um link para definir uma nova senha"
                        : "Cria a conta como mentee e envia um e-mail com link para definir a senha"
                  }
                >
                  {pendingAction === `create-account-${entry.id}` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {entry.status === "invited"
                    ? "Reenviar Convite"
                    : entry.has_profile
                      ? "Enviar Convite"
                      : "Criar Conta e Convidar"}
                </Button>

                {hasReason ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMatch(entry.id)}
                    disabled={pendingAction === `match-${entry.id}`}
                    className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                  >
                    {pendingAction === `match-${entry.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Gerar Match
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestInfo(entry.id)}
                    disabled={pendingAction === `request-info-${entry.id}`}
                    className="gap-1.5"
                  >
                    {pendingAction === `request-info-${entry.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileQuestion className="h-3.5 w-3.5" />
                    )}
                    Pedir Perfil/Quiz
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && hasReason && (
              <div className="mt-3 ml-0 md:ml-0 p-3 bg-muted/40 rounded-lg text-sm whitespace-pre-wrap">
                {entry.reason}
              </div>
            )}

            {match && (
              <div className="mt-3 p-3 border border-primary/20 bg-primary/5 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-primary uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Sugestão de match (IA) — apenas sugestão, nenhum e-mail foi enviado
                </p>
                {match.no_match || match.suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{match.global_justification || "Nenhum mentor compatível encontrado no momento."}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{match.global_justification}</p>
                    <div className="space-y-2">
                      {match.suggestions.map((s) => (
                        <div key={s.mentor_id} className="p-2 bg-background rounded border text-sm">
                          <div className="font-medium">
                            {s.mentor_name}
                            {s.mentor_title && <span className="text-muted-foreground font-normal"> — {s.mentor_title}</span>}
                          </div>
                          {s.mentor_email && (
                            <div className="text-xs text-muted-foreground">{s.mentor_email}</div>
                          )}
                          <p className="text-xs mt-1">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
