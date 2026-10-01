"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CalendarClock,
  CalendarX2,
  ExternalLink,
  Loader2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { MenvoDots } from "@/components/ui/menvo-loader"
import { useToast } from "@/hooks/use-toast"
import { ADMIN_CANCEL_REASON_MIN_LENGTH, type AdminResendTarget } from "@/lib/schemas/appointment"
// Só tipos: o serviço importa e-mail e Google Calendar, que nunca podem ir para o navegador.
import type {
  AdminAppointment,
  AdminAppointmentsResult
} from "@/lib/services/appointments/admin-appointments.service"

const TABS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Aguardando mentor" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "completed", label: "Concluídas" },
  { value: "cancelled", label: "Canceladas" }
]

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-sky-100 text-sky-800 border-sky-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-slate-100 text-slate-700 border-slate-200"
}

const SEARCH_DEBOUNCE_MS = 300

// Celular: cada linha vira um cartão empilhado com o rótulo da coluna (data-label).
// A partir de `md` volta a ser uma tabela normal. Uma estrutura só, sem duplicar o DOM.
const CELL_CLASS =
  "block px-0 py-1.5 md:table-cell md:px-4 md:py-4 before:mb-0.5 before:block before:text-[11px] before:font-semibold before:uppercase before:tracking-wide before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden"

function formatDateTime(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short"
  })
}

function formatWaiting(hours: number): string {
  if (hours < 1) return "há menos de 1h"
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days} ${days === 1 ? "dia" : "dias"}`
}

type ResendPrompt = { appointment: AdminAppointment; target: AdminResendTarget }

export function AdminAppointmentsManager() {
  const { toast } = useToast()
  const [data, setData] = useState<AdminAppointmentsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [details, setDetails] = useState<AdminAppointment | null>(null)
  const [resendPrompt, setResendPrompt] = useState<ResendPrompt | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AdminAppointment | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [busy, setBusy] = useState(false)
  // Ignora respostas de buscas antigas quando o admin digita/troca de aba rápido.
  const requestSeq = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== "all") params.set("status", status)
      if (debouncedSearch) params.set("q", debouncedSearch)
      const qs = params.toString()

      const res = await fetch(`/api/admin/appointments${qs ? `?${qs}` : ""}`)
      if (!res.ok) throw new Error("Falha ao carregar sessões")
      const json = (await res.json()) as AdminAppointmentsResult
      if (seq === requestSeq.current) setData(json)
    } catch (error) {
      console.error(error)
      if (seq === requestSeq.current) {
        toast({ title: "Erro ao carregar as sessões", variant: "destructive" })
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [status, debouncedSearch, toast])

  useEffect(() => {
    load()
  }, [load])

  async function confirmResend() {
    if (!resendPrompt) return
    const { appointment, target } = resendPrompt
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: json.error || "Não foi possível reenviar", variant: "destructive" })
        return
      }
      const sentTo = Array.isArray(json.sentTo) ? json.sentTo.join(" e ") : json.sentTo
      toast({
        title: "E-mail reenviado",
        description: `Enviado para ${sentTo}${json.tokenRenewed ? ". O link de confirmação antigo tinha expirado e foi renovado." : "."}`
      })
      setResendPrompt(null)
      load()
    } catch (error) {
      console.error(error)
      toast({ title: "Não foi possível reenviar", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/appointments/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: json.error || "Não foi possível cancelar", variant: "destructive" })
        return
      }

      const problems: string[] = []
      if (json.notified && !json.notified.mentor) problems.push("o mentor não foi avisado por e-mail")
      if (json.notified && !json.notified.mentee) problems.push("o mentorado não foi avisado por e-mail")
      if (json.calendarEventRemoved === false) problems.push("o evento do Google Calendar não foi removido")

      toast({
        title: "Sessão cancelada",
        description: problems.length
          ? `Atenção: ${problems.join("; ")}. Verifique manualmente.`
          : "Mentor e mentorado foram avisados por e-mail.",
        variant: problems.length ? "destructive" : "default"
      })
      setCancelTarget(null)
      setCancelReason("")
      setDetails(null)
      load()
    } catch (error) {
      console.error(error)
      toast({ title: "Não foi possível cancelar", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const counts = data?.counts ?? {}
  const appointments = data?.appointments ?? []
  const cancelReasonValid = cancelReason.trim().length >= ADMIN_CANCEL_REASON_MIN_LENGTH

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Sessões de Mentoria</h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe todos os pedidos e sessões, reenvie e-mails e cancele quando precisar.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2 self-start md:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6 overflow-x-auto">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-sm md:text-base whitespace-nowrap gap-2"
            >
              {tab.label}
              <Badge variant="secondary" className="rounded-full px-2" data-testid={`count-${tab.value}`}>
                {counts[tab.value] ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por mentor, mentorado, e-mail ou motivo"
          aria-label="Buscar sessões"
          className="pl-9"
        />
      </div>

      {data?.truncated && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Mostrando apenas as sessões mais recentes. Use a busca para localizar registros mais antigos.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex justify-center py-16">
              <MenvoDots />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarX2 className="mb-4 h-12 w-12 opacity-20" />
              <p>Nenhuma sessão encontrada com estes filtros.</p>
            </div>
          ) : (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <Table className="block md:table">
                <TableHeader className="hidden md:table-header-group">
                  <TableRow>
                    <TableHead>Pedido em</TableHead>
                    <TableHead>Sessão</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Mentorado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[220px]">Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="block md:table-row-group">
                  {appointments.map(appointment => (
                    <TableRow
                      key={appointment.id}
                      data-testid={`row-${appointment.id}`}
                      className="mx-3 my-3 block rounded-lg border p-4 md:mx-0 md:my-0 md:table-row md:rounded-none md:border-0 md:border-b md:p-0"
                    >
                      <TableCell data-label="Pedido em" className={`${CELL_CLASS} whitespace-nowrap text-sm`}>
                        {formatDateTime(appointment.createdAt)}
                      </TableCell>
                      <TableCell data-label="Sessão" className={`${CELL_CLASS} whitespace-nowrap text-sm font-medium`}>
                        {formatDateTime(appointment.scheduledAt)}
                      </TableCell>
                      <TableCell data-label="Mentor" className={CELL_CLASS}>
                        <PersonCell person={appointment.mentor} />
                      </TableCell>
                      <TableCell data-label="Mentorado" className={CELL_CLASS}>
                        <PersonCell person={appointment.mentee} />
                      </TableCell>
                      <TableCell data-label="Status" className={CELL_CLASS}>
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant="outline"
                            className={`whitespace-nowrap ${STATUS_STYLES[appointment.status] ?? ""}`}
                          >
                            {appointment.statusLabel}
                          </Badge>
                          <FlagChips appointment={appointment} />
                        </div>
                      </TableCell>
                      <TableCell data-label="Motivo" className={`${CELL_CLASS} md:max-w-xs`}>
                        {appointment.reason ? (
                          <p className="line-clamp-2 text-sm" title={appointment.reason}>
                            {appointment.reason}
                          </p>
                        ) : (
                          <span className="text-sm italic text-muted-foreground">Sem motivo informado</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Ações" className={`${CELL_CLASS} md:text-right`}>
                        <RowActions
                          appointment={appointment}
                          onDetails={() => setDetails(appointment)}
                          onResend={target => setResendPrompt({ appointment, target })}
                          onCancel={() => setCancelTarget(appointment)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes */}
      <Sheet open={Boolean(details)} onOpenChange={open => !open && setDetails(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {details && (
            <>
              <SheetHeader>
                <SheetTitle>Sessão de {details.mentor.name ?? details.mentor.email}</SheetTitle>
                <SheetDescription>
                  {details.statusLabel} · {formatDateTime(details.scheduledAt)}
                  {details.durationMinutes ? ` · ${details.durationMinutes} min` : ""}
                </SheetDescription>
              </SheetHeader>
              <DetailsBody appointment={details} />
              <div className="mt-6 flex flex-wrap gap-2">
                {details.actions.resendMentorRequest && (
                  <Button variant="outline" size="sm" onClick={() => setResendPrompt({ appointment: details, target: "mentor_request" })}>
                    <Send className="mr-2 h-4 w-4" /> Reenviar pedido ao mentor
                  </Button>
                )}
                {details.actions.resendConfirmation && (
                  <Button variant="outline" size="sm" onClick={() => setResendPrompt({ appointment: details, target: "confirmation" })}>
                    <Mail className="mr-2 h-4 w-4" /> Reenviar confirmação
                  </Button>
                )}
                {details.actions.cancel && (
                  <Button variant="destructive" size="sm" onClick={() => setCancelTarget(details)}>
                    <CalendarX2 className="mr-2 h-4 w-4" /> Cancelar sessão
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmar reenvio */}
      <AlertDialog open={Boolean(resendPrompt)} onOpenChange={open => !open && !busy && setResendPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resendPrompt?.target === "mentor_request" ? "Reenviar pedido ao mentor?" : "Reenviar confirmação?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resendPrompt?.target === "mentor_request"
                ? `O mentor ${resendPrompt.appointment.mentor.name ?? ""} (${resendPrompt.appointment.mentor.email ?? "sem e-mail"}) receberá de novo o e-mail com o botão para confirmar. Se o link anterior tiver expirado, um novo será gerado.`
                : `Mentor (${resendPrompt?.appointment.mentor.email ?? "sem e-mail"}) e mentorado (${resendPrompt?.appointment.mentee.email ?? "sem e-mail"}) receberão de novo o e-mail de confirmação com o link da reunião.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={event => {
                event.preventDefault()
                confirmResend()
              }}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Reenviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancelar */}
      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={open => {
          if (!open && !busy) {
            setCancelTarget(null)
            setCancelReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar esta sessão?</DialogTitle>
            <DialogDescription>
              Mentor e mentorado serão avisados por e-mail com o motivo abaixo, e o evento será removido do Google
              Calendar. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium">
              Motivo do cancelamento *
            </label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Ex: Pedido duplicado para o mesmo horário."
              maxLength={1000}
              className="min-h-[100px]"
            />
            <p className={`text-xs ${cancelReasonValid ? "text-emerald-600" : "text-amber-600"}`}>
              {cancelReasonValid
                ? "Esse texto será enviado às duas pessoas."
                : `Mínimo de ${ADMIN_CANCEL_REASON_MIN_LENGTH} caracteres: ${cancelReason.trim().length}/${ADMIN_CANCEL_REASON_MIN_LENGTH}`}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setCancelTarget(null)
                setCancelReason("")
              }}
            >
              Voltar
            </Button>
            <Button variant="destructive" disabled={!cancelReasonValid || busy} onClick={confirmCancel}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PersonCell({ person }: { person: AdminAppointment["mentor"] }) {
  return (
    <div className="md:min-w-[200px]">
      <p className="text-sm font-medium">{person.name ?? <span className="italic text-muted-foreground">Sem nome</span>}</p>
      {person.email && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{person.email}</p>}
      {person.nameIncomplete && (
        <Badge variant="outline" className="mt-1 border-amber-300 bg-amber-50 text-amber-800">
          Perfil incompleto
        </Badge>
      )}
    </div>
  )
}

function FlagChips({ appointment }: { appointment: AdminAppointment }) {
  const { flags } = appointment
  const chips: { key: string; text: string; tone: string }[] = []

  if (appointment.status === "pending") {
    if (flags.sessionPassed) {
      chips.push({ key: "passed", text: "Horário já passou", tone: "text-red-700" })
    } else if (flags.stale && flags.waitingHours !== null) {
      chips.push({ key: "stale", text: `Sem resposta ${formatWaiting(flags.waitingHours)}`, tone: "text-amber-700" })
    }
    if (flags.tokenExpired) chips.push({ key: "token", text: "Link do e-mail expirado", tone: "text-amber-700" })
  }
  if (flags.missingReason) chips.push({ key: "reason", text: "Sem motivo", tone: "text-muted-foreground" })

  if (chips.length === 0) return null
  return (
    <ul className="space-y-0.5">
      {chips.map(chip => (
        <li key={chip.key} className={`flex items-center gap-1 text-xs ${chip.tone}`}>
          <AlertTriangle className="h-3 w-3" /> {chip.text}
        </li>
      ))}
    </ul>
  )
}

function RowActions({
  appointment,
  onDetails,
  onResend,
  onCancel
}: {
  appointment: AdminAppointment
  onDetails: () => void
  onResend: (target: AdminResendTarget) => void
  onCancel: () => void
}) {
  const { actions } = appointment
  const label = `Ações da sessão de ${appointment.mentee.name ?? appointment.mentee.email ?? "mentorado"} com ${appointment.mentor.name ?? appointment.mentor.email ?? "mentor"}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sessão</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onDetails}>
          <CalendarClock className="mr-2 h-4 w-4" /> Ver detalhes
        </DropdownMenuItem>
        {(actions.resendMentorRequest || actions.resendConfirmation) && <DropdownMenuSeparator />}
        {actions.resendMentorRequest && (
          <DropdownMenuItem onSelect={() => onResend("mentor_request")}>
            <Send className="mr-2 h-4 w-4" /> Reenviar pedido ao mentor
          </DropdownMenuItem>
        )}
        {actions.resendConfirmation && (
          <DropdownMenuItem onSelect={() => onResend("confirmation")}>
            <Mail className="mr-2 h-4 w-4" /> Reenviar confirmação
          </DropdownMenuItem>
        )}
        {actions.cancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onCancel} className="text-red-600 focus:text-red-600">
              <CalendarX2 className="mr-2 h-4 w-4" /> Cancelar sessão
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DetailsBody({ appointment }: { appointment: AdminAppointment }) {
  const rows: [string, React.ReactNode][] = [
    ["Pedido criado", formatDateTime(appointment.createdAt)],
    ["Última alteração", formatDateTime(appointment.updatedAt)],
    ["Mentor", <PersonCell key="mentor" person={appointment.mentor} />],
    ["Mentorado", <PersonCell key="mentee" person={appointment.mentee} />]
  ]

  return (
    <div className="mt-6 space-y-5 text-sm">
      <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="mb-1 font-semibold">Motivo do pedido</h3>
        {appointment.reason ? (
          <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{appointment.reason}</p>
        ) : (
          <p className="italic text-muted-foreground">O mentorado não informou um motivo.</p>
        )}
      </section>

      {appointment.mentorNotes && (
        <section>
          <h3 className="mb-1 font-semibold">Observações do mentor</h3>
          <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{appointment.mentorNotes}</p>
        </section>
      )}

      {appointment.status === "cancelled" && (
        <section>
          <h3 className="mb-1 font-semibold">Cancelamento</h3>
          <p className="text-muted-foreground">
            {appointment.cancelledBy === "system" ? "Expirou automaticamente" : "Cancelada por uma pessoa"} em{" "}
            {formatDateTime(appointment.cancelledAt)}
          </p>
          {appointment.cancellationReason && (
            <p className="mt-1 whitespace-pre-wrap rounded-md bg-red-50 p-3 text-red-900">
              {appointment.cancellationReason}
            </p>
          )}
        </section>
      )}

      <section className="space-y-1">
        <h3 className="font-semibold">Reunião</h3>
        {appointment.googleMeetLink ? (
          <a className="flex items-center gap-1 text-primary hover:underline" href={appointment.googleMeetLink} target="_blank" rel="noreferrer">
            Link do Google Meet <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-muted-foreground">Sem link de reunião.</p>
        )}
        {appointment.googleCalendarLink && (
          <a className="flex items-center gap-1 text-primary hover:underline" href={appointment.googleCalendarLink} target="_blank" rel="noreferrer">
            Evento no Google Calendar <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {appointment.pendingReminderSentAt && (
          <p className="text-muted-foreground">Lembrete ao mentor enviado em {formatDateTime(appointment.pendingReminderSentAt)}.</p>
        )}
      </section>

      <p className="break-all text-xs text-muted-foreground">ID: {appointment.id}</p>
    </div>
  )
}
