'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Shield,
    Search,
    RefreshCw,
    Eye,
    Filter,
    Calendar,
    User,
    Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
    id: string
    admin_user_id: string
    action: string
    target_user_id?: string
    target_user_email?: string
    details: Record<string, any>
    ip_address?: string
    user_agent?: string
    created_at: string
    admin?: {
        full_name: string
        email: string
    }
    target?: {
        full_name: string
        email: string
    }
}

interface AuditStats {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
}

const ACTION_LABELS = {
    user_created: 'Usuário Criado',
    user_updated: 'Usuário Atualizado',
    user_deleted: 'Usuário Deletado',
    user_role_changed: 'Role Alterado',
    user_status_changed: 'Status Alterado',
    password_reset: 'Senha Resetada',
    email_changed: 'Email Alterado',
    bulk_action: 'Ação em Lote'
}

const ACTION_COLORS = {
    user_created: 'bg-green-500',
    user_updated: 'bg-blue-500',
    user_deleted: 'bg-red-500',
    user_role_changed: 'bg-orange-500',
    user_status_changed: 'bg-purple-500',
    password_reset: 'bg-yellow-500',
    email_changed: 'bg-cyan-500',
    bulk_action: 'bg-gray-500'
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [stats, setStats] = useState<AuditStats>({
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
    })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [actionFilter, setActionFilter] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    useEffect(() => {
        loadAuditLogs()
        loadStats()
    }, [page, searchTerm, actionFilter])

    const loadAuditLogs = async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(searchTerm && { search: searchTerm }),
                ...(actionFilter && { action: actionFilter })
            })

            const response = await fetch(`/api/admin/audit-logs?${params}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar logs')
            }

            setLogs(data.logs || [])
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error('Erro ao carregar logs:', error)
            toast.error('Erro ao carregar logs de auditoria')
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const response = await fetch('/api/admin/audit-logs/stats')
            const data = await response.json()

            if (response.ok) {
                setStats(data)
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error)
        }
    }

    const getActionBadge = (action: string) => {
        const label = ACTION_LABELS[action as keyof typeof ACTION_LABELS] || action
        const color = ACTION_COLORS[action as keyof typeof ACTION_COLORS] || 'bg-gray-500'

        return (
            <Badge className={`${color} text-white`}>
                {label}
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR')
    }

    const formatUserAgent = (userAgent?: string) => {
        if (!userAgent || userAgent === 'unknown') return 'Desconhecido'

        // Extrair informações básicas do user agent
        const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Desconhecido'
        return browser
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8" />
                        Logs de Auditoria
                    </h1>
                    <p className="text-muted-foreground">
                        Histórico de ações administrativas na plataforma
                    </p>
                </div>

                <Button
                    onClick={loadAuditLogs}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Todas as ações</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hoje</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.today}</div>
                        <p className="text-xs text-muted-foreground">Últimas 24h</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.thisWeek}</div>
                        <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.thisMonth}</div>
                        <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por admin, usuário ou email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtrar por ação" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas as ações</SelectItem>
                                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(searchTerm || actionFilter) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('')
                                    setActionFilter('')
                                }}
                            >
                                Limpar Filtros
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Registros de Auditoria</CardTitle>
                    <CardDescription>
                        Histórico detalhado de todas as ações administrativas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
                            <p className="text-muted-foreground">
                                {searchTerm || actionFilter
                                    ? 'Tente ajustar os filtros de busca'
                                    : 'Ainda não há ações administrativas registradas'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data/Hora</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Ação</TableHead>
                                        <TableHead>Usuário Alvo</TableHead>
                                        <TableHead>IP</TableHead>
                                        <TableHead>Detalhes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {log.admin?.full_name || 'Admin'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {log.admin?.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell>
                                                {log.target_user_email ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {log.target?.full_name || 'Usuário'}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {log.target_user_email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {log.ip_address || 'Desconhecido'}
                                            </TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedLog(log)}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Detalhes da Ação</DialogTitle>
                                                            <DialogDescription>
                                                                Informações completas sobre a ação administrativa
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <strong>Data/Hora:</strong>
                                                                    <p>{formatDate(log.created_at)}</p>
                                                                </div>
                                                                <div>
                                                                    <strong>Ação:</strong>
                                                                    <p>{getActionBadge(log.action)}</p>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <strong>Navegador:</strong>
                                                                <p>{formatUserAgent(log.user_agent)}</p>
                                                            </div>

                                                            <div>
                                                                <strong>Detalhes:</strong>
                                                                <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-x-auto">
                                                                    {JSON.stringify(log.details, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Paginação */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="flex items-center px-4">
                                        Página {page} de {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
