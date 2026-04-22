'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Play,
    RefreshCw,
    Users
} from 'lucide-react'
import { toast } from 'sonner'

interface UserMigration {
    id: string
    old_user_id: string
    new_user_id?: string
    email: string
    old_user_data: any
    migration_status: 'pending' | 'completed' | 'failed' | 'conflict'
    migration_notes?: string
    conflict_reason?: string
    created_at: string
    updated_at: string
    migrated_at?: string
}

interface MigrationStats {
    total: number
    pending: number
    completed: number
    failed: number
    conflicts: number
}

export default function UserMigrationsPage() {
    const [migrations, setMigrations] = useState<UserMigration[]>([])
    const [stats, setStats] = useState<MigrationStats>({
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        conflicts: 0
    })
    const [loading, setLoading] = useState(true)
    const [selectedMigration, setSelectedMigration] = useState<UserMigration | null>(null)
    const [isRunningMigration, setIsRunningMigration] = useState(false)

    const supabase = createClientComponentClient()

    useEffect(() => {
        loadMigrations()
    }, [])

    const loadMigrations = async () => {
        try {
            const { data, error } = await supabase
                .from('user_migrations')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setMigrations(data || [])

            // Calcular estatísticas
            const newStats = data?.reduce((acc, migration) => {
                acc.total++
                acc[migration.migration_status]++
                return acc
            }, { total: 0, pending: 0, completed: 0, failed: 0, conflicts: 0 }) || stats

            setStats(newStats)
        } catch (error) {
            console.error('Erro ao carregar migrações:', error)
            toast.error('Erro ao carregar dados de migração')
        } finally {
            setLoading(false)
        }
    }

    const runMigrationScript = async () => {
        setIsRunningMigration(true)
        try {
            const response = await fetch('/api/admin/run-migration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao executar migração')
            }

            toast.success(`Migração concluída: ${result.successful} sucessos, ${result.conflicts} conflitos, ${result.failed} falhas`)
            loadMigrations()
        } catch (error) {
            console.error('Erro na migração:', error)
            toast.error('Erro ao executar migração')
        } finally {
            setIsRunningMigration(false)
        }
    }

    const resolveMigrationConflict = async (migrationId: string, action: 'merge' | 'skip', notes?: string) => {
        try {
            const response = await fetch('/api/admin/resolve-migration-conflict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ migrationId, action, notes })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao resolver conflito')
            }

            toast.success('Conflito resolvido com sucesso')
            loadMigrations()
            setSelectedMigration(null)
        } catch (error) {
            console.error('Erro ao resolver conflito:', error)
            toast.error('Erro ao resolver conflito')
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
            completed: { variant: 'default' as const, icon: CheckCircle, text: 'Concluído' },
            failed: { variant: 'destructive' as const, icon: XCircle, text: 'Falhou' },
            conflict: { variant: 'outline' as const, icon: AlertCircle, text: 'Conflito' }
        }

        const config = variants[status as keyof typeof variants]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.text}
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Migração de Usuários</h1>
                    <p className="text-muted-foreground">
                        Gerencie a migração de usuários da plataforma antiga
                    </p>
                </div>

                <Button
                    onClick={runMigrationScript}
                    disabled={isRunningMigration}
                    className="flex items-center gap-2"
                >
                    {isRunningMigration ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                    {isRunningMigration ? 'Executando...' : 'Executar Migração'}
                </Button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conflitos</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.conflicts}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Falhas</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Migrações */}
            <Card>
                <CardHeader>
                    <CardTitle>Registros de Migração</CardTitle>
                    <CardDescription>
                        Lista de todos os usuários identificados para migração
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
                            <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
                            <TabsTrigger value="conflicts">Conflitos ({stats.conflicts})</TabsTrigger>
                            <TabsTrigger value="failed">Falhas ({stats.failed})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <MigrationTable
                                migrations={migrations}
                                onViewDetails={setSelectedMigration}
                                onResolveConflict={resolveMigrationConflict}
                            />
                        </TabsContent>

                        <TabsContent value="pending">
                            <MigrationTable
                                migrations={migrations.filter(m => m.migration_status === 'pending')}
                                onViewDetails={setSelectedMigration}
                                onResolveConflict={resolveMigrationConflict}
                            />
                        </TabsContent>

                        <TabsContent value="conflicts">
                            <MigrationTable
                                migrations={migrations.filter(m => m.migration_status === 'conflict')}
                                onViewDetails={setSelectedMigration}
                                onResolveConflict={resolveMigrationConflict}
                            />
                        </TabsContent>

                        <TabsContent value="failed">
                            <MigrationTable
                                migrations={migrations.filter(m => m.migration_status === 'failed')}
                                onViewDetails={setSelectedMigration}
                                onResolveConflict={resolveMigrationConflict}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Dialog de Detalhes */}
            {selectedMigration && (
                <MigrationDetailsDialog
                    migration={selectedMigration}
                    onClose={() => setSelectedMigration(null)}
                    onResolveConflict={resolveMigrationConflict}
                />
            )}
        </div>
    )
}

interface MigrationTableProps {
    migrations: UserMigration[]
    onViewDetails: (migration: UserMigration) => void
    onResolveConflict: (migrationId: string, action: 'merge' | 'skip', notes?: string) => void
}

function MigrationTable({ migrations, onViewDetails }: MigrationTableProps) {
    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
            completed: { variant: 'default' as const, icon: CheckCircle, text: 'Concluído' },
            failed: { variant: 'destructive' as const, icon: XCircle, text: 'Falhou' },
            conflict: { variant: 'outline' as const, icon: AlertCircle, text: 'Conflito' }
        }

        const config = variants[status as keyof typeof variants]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.text}
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR')
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>ID Antigo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {migrations.map((migration) => (
                    <TableRow key={migration.id}>
                        <TableCell className="font-medium">{migration.email}</TableCell>
                        <TableCell className="font-mono text-sm">{migration.old_user_id}</TableCell>
                        <TableCell>{getStatusBadge(migration.migration_status)}</TableCell>
                        <TableCell>{formatDate(migration.created_at)}</TableCell>
                        <TableCell>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetails(migration)}
                                className="flex items-center gap-1"
                            >
                                <Eye className="h-3 w-3" />
                                Ver Detalhes
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

interface MigrationDetailsDialogProps {
    migration: UserMigration
    onClose: () => void
    onResolveConflict: (migrationId: string, action: 'merge' | 'skip', notes?: string) => void
}

function MigrationDetailsDialog({ migration, onClose, onResolveConflict }: MigrationDetailsDialogProps) {
    const [notes, setNotes] = useState('')

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalhes da Migração</DialogTitle>
                    <DialogDescription>
                        Informações detalhadas sobre a migração do usuário
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm">{migration.email}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <div className="mt-1">
                                {/* Status badge aqui */}
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Dados do Usuário Antigo</Label>
                        <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(migration.old_user_data, null, 2)}
                        </pre>
                    </div>

                    {migration.conflict_reason && (
                        <div>
                            <Label className="text-sm font-medium text-yellow-600">Razão do Conflito</Label>
                            <p className="text-sm mt-1">{migration.conflict_reason}</p>
                        </div>
                    )}

                    {migration.migration_notes && (
                        <div>
                            <Label className="text-sm font-medium">Notas</Label>
                            <p className="text-sm mt-1">{migration.migration_notes}</p>
                        </div>
                    )}

                    {migration.migration_status === 'conflict' && (
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-sm font-medium">Resolver Conflito</Label>
                            <Textarea
                                placeholder="Notas sobre a resolução (opcional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onResolveConflict(migration.id, 'merge', notes)}
                                    className="flex-1"
                                >
                                    Mesclar Dados
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => onResolveConflict(migration.id, 'skip', notes)}
                                    className="flex-1"
                                >
                                    Pular Migração
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}