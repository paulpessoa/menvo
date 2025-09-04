"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Filter
} from "lucide-react"
import { toast } from "sonner"

interface User {
    id: string
    email: string
    full_name: string | null
    user_role: string
    verification_status: string
    is_volunteer: boolean
    created_at: string
    last_sign_in_at?: string
    email_confirmed_at?: string
}

interface UserFormData {
    email: string
    password: string
    full_name: string
    user_role: string
}

const USER_ROLES = [
    { value: "mentee", label: "Mentee" },
    { value: "mentor", label: "Mentor" },
    { value: "volunteer", label: "Voluntário" },
    { value: "admin", label: "Admin" },
    { value: "moderator", label: "Moderador" }
]

const VERIFICATION_STATUS = [
    { value: "pending", label: "Pendente", color: "secondary" },
    { value: "verified", label: "Verificado", color: "default" },
    { value: "rejected", label: "Rejeitado", color: "destructive" }
]

export default function ManageUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<UserFormData>({
        email: "",
        password: "",
        full_name: "",
        user_role: "mentee"
    })

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...(searchTerm && { search: searchTerm }),
                ...(roleFilter && { role: roleFilter }),
                ...(statusFilter && { status: statusFilter })
            })

            const response = await fetch(`/api/admin/users/manage?${params}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch users")
            }

            setUsers(data.users || [])
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    const createUser = async () => {
        try {
            const response = await fetch("/api/admin/users/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create user")
            }

            toast.success("Usuário criado com sucesso!")
            setShowCreateDialog(false)
            setFormData({ email: "", password: "", full_name: "", user_role: "mentee" })
            fetchUsers()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao criar usuário")
        }
    }

    const updateUser = async () => {
        if (!selectedUser) return

        try {
            const updates = {
                full_name: formData.full_name,
                user_role: formData.user_role,
                ...(formData.email !== selectedUser.email && { email: formData.email })
            }

            const response = await fetch("/api/admin/users/manage", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    updates
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to update user")
            }

            toast.success("Usuário atualizado com sucesso!")
            setShowEditDialog(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuário")
        }
    }

    const deleteUser = async () => {
        if (!selectedUser) return

        try {
            const response = await fetch(`/api/admin/users/manage?userId=${selectedUser.id}`, {
                method: "DELETE"
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete user")
            }

            toast.success("Usuário deletado com sucesso!")
            setShowDeleteDialog(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao deletar usuário")
        }
    }

    const openEditDialog = (user: User) => {
        setSelectedUser(user)
        setFormData({
            email: user.email,
            password: "", // Don't pre-fill password
            full_name: user.full_name || "",
            user_role: user.user_role
        })
        setShowEditDialog(true)
    }

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user)
        setShowDeleteDialog(true)
    }

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: "bg-red-500",
            moderator: "bg-orange-500",
            mentor: "bg-blue-500",
            volunteer: "bg-green-500",
            mentee: "bg-gray-500"
        }
        return (
            <Badge className={colors[role] || "bg-gray-500"}>
                {USER_ROLES.find(r => r.value === role)?.label || role}
            </Badge>
        )
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = VERIFICATION_STATUS.find(s => s.value === status)
        return (
            <Badge variant={statusConfig?.color as any || "secondary"}>
                {statusConfig?.label || status}
            </Badge>
        )
    }

    useEffect(() => {
        fetchUsers()
    }, [page, searchTerm, roleFilter, statusFilter])

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
                        <p className="text-muted-foreground">
                            Controle total sobre usuários da plataforma
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={fetchUsers} variant="outline" disabled={loading}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Atualizar
                        </Button>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Usuário
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                                    <DialogDescription>
                                        Adicione um novo usuário à plataforma
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="usuario@exemplo.com"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="password">Senha</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Senha temporária"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="full_name">Nome Completo</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Nome do usuário"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="user_role">Role</Label>
                                        <Select value={formData.user_role} onValueChange={(value) => setFormData({ ...formData, user_role: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {USER_ROLES.map(role => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={createUser}>Criar Usuário</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nome ou email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Filtrar por role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos os roles</SelectItem>
                                    {USER_ROLES.map(role => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos os status</SelectItem>
                                    {VERIFICATION_STATUS.map(status => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(searchTerm || roleFilter || statusFilter) && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm("")
                                        setRoleFilter("")
                                        setStatusFilter("")
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Usuários ({users.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <RefreshCw className="h-8 w-8 animate-spin" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm || roleFilter || statusFilter
                                        ? "Tente ajustar os filtros de busca"
                                        : "Comece criando o primeiro usuário"
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Voluntário</TableHead>
                                            <TableHead>Criado em</TableHead>
                                            <TableHead>Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    {user.full_name || "Sem nome"}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{getRoleBadge(user.user_role)}</TableCell>
                                                <TableCell>{getStatusBadge(user.verification_status)}</TableCell>
                                                <TableCell>
                                                    {user.is_volunteer ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditDialog(user)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDeleteDialog(user)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
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

                {/* Edit Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                            <DialogDescription>
                                Modifique as informações do usuário
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit_email">Email</Label>
                                <Input
                                    id="edit_email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit_full_name">Nome Completo</Label>
                                <Input
                                    id="edit_full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit_user_role">Role</Label>
                                <Select value={formData.user_role} onValueChange={(value) => setFormData({ ...formData, user_role: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {USER_ROLES.map(role => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={updateUser}>Salvar Alterações</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Exclusão</DialogTitle>
                            <DialogDescription>
                                Tem certeza que deseja deletar o usuário <strong>{selectedUser?.full_name || selectedUser?.email}</strong>?
                                Esta ação não pode ser desfeita.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={deleteUser}>
                                Deletar Usuário
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}