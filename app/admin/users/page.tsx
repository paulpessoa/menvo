'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, SearchIcon, EditIcon, Trash2Icon, SaveIcon, XIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile, user_role } from '@/types/database'

interface UserProfileWithId extends user_profile {
  id: string; // Supabase user ID
}

async function fetchUsers(): Promise<UserProfileWithId[]> {
  const response = await fetch('/api/admin/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  const data = await response.json()
  return data.data
}

async function updateUser(user: Partial<UserProfileWithId>): Promise<UserProfileWithId> {
  const response = await fetch(`/api/admin/users/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update user')
  }
  const data = await response.json()
  return data.data
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { data: users, isLoading, isError, error } = useQuery<UserProfileWithId[], Error>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers,
  })

  const updateUserMutation = useMutation<UserProfileWithId, Error, Partial<UserProfileWithId>>({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      toast({
        title: 'Usuário atualizado!',
        description: 'As informações do usuário foram salvas com sucesso.',
      })
      setEditingUser(null)
    },
    onError: (err) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<UserProfileWithId | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const handleEditClick = (user: UserProfileWithId) => {
    setEditingUser({ ...user })
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingUser(null)
  }

  const handleSave = () => {
    if (editingUser) {
      updateUserMutation.mutate(editingUser)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao carregar usuários</h1>
        <p className="text-lg mb-6">{error?.message || 'Ocorreu um erro inesperado.'}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Gerenciamento de Usuários</h1>

        <div className="mb-6 flex justify-end">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Perfil Completo</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role || 'mentee'}</TableCell>
                    <TableCell>{user.is_profile_complete ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{user.verified_at ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                        <EditIcon className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      {/* <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash2Icon className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {editingUser && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>
                  Faça alterações no perfil do usuário aqui. Clique em salvar quando terminar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="full_name"
                    value={editingUser.full_name || ''}
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
                    value={editingUser.email || ''}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Função
                  </Label>
                  <Select
                    value={editingUser.role || 'mentee'}
                    onValueChange={(value: user_role) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentee">Mentee</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_profile_complete" className="text-right">
                    Perfil Completo
                  </Label>
                  <Input
                    id="is_profile_complete"
                    type="checkbox"
                    checked={editingUser.is_profile_complete || false}
                    onChange={(e) => setEditingUser({ ...editingUser, is_profile_complete: e.target.checked })}
                    className="col-span-3 w-4 h-4"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="verified_at" className="text-right">
                    Verificado
                  </Label>
                  <Input
                    id="verified_at"
                    type="checkbox"
                    checked={!!editingUser.verified_at}
                    onChange={(e) => setEditingUser({ ...editingUser, verified_at: e.target.checked ? new Date().toISOString() : null })}
                    className="col-span-3 w-4 h-4"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose}>
                  <XIcon className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="mr-2 h-4 w-4" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  )
}
