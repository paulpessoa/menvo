"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Loader2, UserPlus, Sparkles, FileQuestion, ChevronDown, ChevronUp, ListChecks, CheckCircle2, MessageCircle, Copy, Search } from "lucide-react"
import { toast } from "sonner"

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  invited: "Convidado"
}

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
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [bulkRunning, setBulkRunning] = useState(false)

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        (entry.whatsapp || "").includes(query)
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [entries, search, statusFilter])

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

  const handleBulkCreateAccounts = async () => {
    const pendingCount = entries.filter(e => e.status === "pending").length
    if (pendingCount === 0) {
      toast.info("Não há registros aguardando para criar conta.")
      return
    }
    if (!window.confirm(`Criar conta e enviar convite por e-mail para ${pendingCount} pessoa(s) aguardando na lista? Essa ação não pode ser desfeita.`)) {
      return
    }
    setBulkRunning(true)
    try {
      const response = await fetch("/api/admin/waiting-list/bulk-create-accounts", { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Falha ao criar contas em lote")
      if (data.stoppedEarly) {
        toast.warning(
          `${data.created} conta(s) criada(s) e convite(s) enviado(s). Parou por limite de envio de e-mail — faltam ${data.remaining} registro(s). Tente novamente mais tarde ou amanhã.`
        )
        console.error("[bulk-create-accounts] parou cedo:", data.errors)
      } else if (data.failed > 0) {
        toast.warning(`${data.created} conta(s) criada(s). ${data.failed} falharam — veja o console.`)
        console.error("[bulk-create-accounts] erros:", data.errors)
      } else {
        toast.success(`${data.created} conta(s) criada(s) e convite(s) enviado(s)!`)
      }
      fetchEntries()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar contas em lote")
    } finally {
      setBulkRunning(false)
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
    <div>
      <div className="flex flex-col sm:flex-row gap-3 p-4 pb-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Aguardando</SelectItem>
            <SelectItem value="invited">Convidado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="default"
          size="sm"
          onClick={handleBulkCreateAccounts}
          disabled={bulkRunning}
          className="gap-1.5 shrink-0"
          title="Cria conta e envia convite por e-mail para todos os registros aguardando"
        >
          {bulkRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
          Criar todas as contas
        </Button>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          Nenhum registro encontrado para esse filtro.
        </p>
      ) : (
      <div className="divide-y">
      {filteredEntries.map((entry) => {
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
      )}
    </div>
  )
}
