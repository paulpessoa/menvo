"use client"

import { useEffect, useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchActivityLogs } from "@/lib/services/admin/activity-logs.client"
import { ACTIVITY_TABLES } from "@/lib/services/admin/activity-logs.types"
import { TABLE_LABELS, describeAction, describeChanges } from "@/lib/services/admin/activity-logs.format"

function Person({ person }: { person: { full_name: string | null; email: string | null } | null }) {
  if (!person) return <span className="text-muted-foreground">Sistema</span>
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{person.full_name || "Sem nome"}</p>
      <p className="truncate text-xs text-muted-foreground">{person.email}</p>
    </div>
  )
}

/**
 * Admin view of everything users change on their data (profile, availability,
 * roles, sessions), with free-text search. Search is debounced and runs
 * server-side so it covers the whole history, not just the visible page.
 */
export function ActivityLogsTable() {
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [table, setTable] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [input])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-activity-logs", search, table, page],
    queryFn: () => fetchActivityLogs({ search, table: table === "all" ? undefined : table, page }),
    placeholderData: keepPreviousData
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Buscar por usuário, e-mail, campo ou valor..."
            className="pl-9"
          />
        </div>
        <Select value={table} onValueChange={v => { setTable(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {ACTIVITY_TABLES.map(t => (
              <SelectItem key={t} value={t}>{TABLE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível carregar os logs.
        </p>
      )}

      {isLoading ? (
        <div className="animate-pulse py-20 text-center italic text-muted-foreground">Buscando atividade...</div>
      ) : data && data.logs.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Nenhuma atividade encontrada.</div>
      ) : (
        data && (
          <Card className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Quando</TableHead>
                    <TableHead>Usuário afetado</TableHead>
                    <TableHead>Feito por</TableHead>
                    <TableHead className="w-44">Ação</TableHead>
                    <TableHead>O que mudou</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell><Person person={log.subject} /></TableCell>
                      <TableCell><Person person={log.actor} /></TableCell>
                      <TableCell><Badge variant="secondary">{describeAction(log)}</Badge></TableCell>
                      <TableCell className="max-w-md space-y-0.5 text-xs">
                        {describeChanges(log).map(line => (
                          <p key={line} className="break-words">{line}</p>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} registro(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}
