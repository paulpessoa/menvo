"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Eye, Edit, Save, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  name: string
  email: string
  status: string
  roles: string[]
  email_verified: boolean
}

const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/admin/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  const data = await response.json()
  return data.users
}

export default function AdminUsersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: profile, isLoading: isProfileLoading } = useUserProfile()
  
  const { data: users = [], isLoading: isUsersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    enabled: !!profile && profile.role === 'admin',
  })

  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedRoles, setEditedRoles] = useState<string[]>([])
  const [editedStatus, setEditedStatus] = useState<string>('')
  
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, roles, status }: { userId: string, roles: string[], status: string }) => {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roles, status }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditingUser(null)
    },
  })

  useEffect(() => {
    if (!isProfileLoading && (!profile || profile.role !== 'admin')) {
      router.push('/unauthorized')
    }
  }, [profile, isProfileLoading, router])

  const handleEdit = (user: User) => {
    setEditingUser(user.id)
    setEditedRoles(user.roles)
    setEditedStatus(user.status)
  }

  const handleCancel = () => {
    setEditingUser(null)
  }

  const handleSave = (userId: string) => {
    updateUserMutation.mutate({ userId, roles: editedRoles, status: editedStatus })
  }

  if (isProfileLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
      {updateUserMutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {updateUserMutation.error.message}
        </div>
      )}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Usuários da Plataforma</h2>
        {isUsersLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-6 w-6 mr-2" /> Carregando usuários...
          </div>
        ) : usersError ? (
           <div className="text-red-500">Erro ao carregar usuários.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select value={editedStatus} onValueChange={setEditedStatus}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="pending_verification">Pendente</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select value={editedRoles[0]} onValueChange={(role) => setEditedRoles([role])}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['admin', 'mentor', 'mentee', 'company', 'recruiter'].map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleSave(user.id)} disabled={updateUserMutation.isPending}>
                            {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
