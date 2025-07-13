"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { createClient } from "@/utils/supabase/client"
import { UserPlus, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { user_role, user_status } from "@/types/database"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: user_role
  status: user_status
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateUserRole = async (userId: string, newRole: user_role) => {
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)
      if (error) throw error
      toast.success("Role do usuário atualizada com sucesso!")
      fetchUsers() // Recarrega a lista
    } catch (error) {
      console.error("Erro ao atualizar role:", error)
      toast.error("Falha ao atualizar a role do usuário.")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedRole === "all" || user.role === selectedRole),
  )

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: "bg-red-100 text-red-800",
      mentor: "bg-blue-100 text-blue-800",
      mentee: "bg-green-100 text-green-800",
      volunteer: "bg-purple-100 text-purple-800",
      moderator: "bg-orange-100 text-orange-800",
      pending: "bg-gray-100 text-gray-800",
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredPermissions={["admin_users"]}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Administre usuários, roles e permissões.</p>
          </div>
          <Button disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Usuário (Em breve)
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por Nome ou Email</Label>
              <Input
                id="search"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Filtrar por Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="mentee">Mentee</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{user.full_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || "Nome não definido"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value as user_role)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="mentee">Mentee</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.status)}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" disabled>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
