'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { Loader2, Edit, Trash2, Search, UserPlus } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile, user_role } from '@/types/database'
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const { user, loading: authLoading, getAdminUsers, updateAdminUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [users, setUsers] = useState<user_profile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<user_profile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== "admin")) {
      router.push("/unauthorized")
    } else if (user && user.user_metadata?.role === "admin") {
      fetchUsers()
    }
  }, [user, authLoading, router])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await getAdminUsers()
      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message || "Não foi possível buscar a lista de usuários.",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleEditClick = (user: user_profile) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSubmitting(true)
    try {
      const { error } = await updateAdminUser(editingUser.id, {
        full_name: editingUser.full_name,
        email: editingUser.email, // Assuming email can be updated, though often restricted
        role: editingUser.role,
        is_profile_complete: editingUser.is_profile_complete,
        // Add other fields you want to allow editing
      })

      if (error) throw error

      toast({
        title: "Usuário atualizado",
        description: `O perfil de ${editingUser.full_name} foi atualizado com sucesso.`,
        variant: "default",
      })
      setIsEditModalOpen(false)
      fetchUsers() // Re-fetch users to show updated data
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar o perfil do usuário.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${userName}? Esta ação é irreversível.`)) {
      return
    }
    // TODO: Implement actual delete user API call
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A exclusão de usuários ainda não está implementada.",
      variant: "info",
    })
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading || (user && user.user_metadata?.role !== "admin" && !loadingUsers)) {
    return null // Redirect handled by useEffect
  }

  if (loadingUsers) {
    return (
      <div className="container py-8 md:py-12 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando usuários...</p>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container py-8 md:py-12">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">Visualize, edite e gerencie todos os usuários da plataforma.</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Lista de Usuários</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Novo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários por nome, e-mail ou função..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Perfil Completo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {user.role || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_profile_complete ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                              className="mr-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Deletar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>
                  Faça alterações no perfil do usuário. Clique em salvar quando terminar.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="full_name" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="full_name"
                      value={editingUser.full_name || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingUser.email || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="col-span-3"
                      disabled // Email is often not directly editable via this interface
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Função
                    </Label>
                    <Select
                      value={editingUser.role || ""}
                      onValueChange={(value: user_role) => setEditingUser({ ...editingUser, role: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mentee">Mentee</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="profile_complete" className="text-right">
                      Perfil Completo
                    </Label>
                    <Checkbox
                      id="profile_complete"
                      checked={editingUser.is_profile_complete || false}
                      onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_profile_complete: checked as boolean })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  )
}
