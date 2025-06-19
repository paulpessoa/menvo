"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Eye, Edit, Save, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUserRoles } from '@/hooks/useUserRoles'

interface User {
  id: string
  name: string
  email: string
  status: string
  roles: string[]
  email_verified: boolean
}

export default function AdminPage() {
  const dataProfile  = useUserRoles()
  const isAdmin = dataProfile ?.roles.some(role => role === 'admin')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedRoles, setEditedRoles] = useState<string[]>([])
  const [editedStatus, setEditedStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (dataProfile && dataProfile .roles) {
      console.log('[MENVO] Acessos do usuário (admin):', dataProfile.roles.map(r => r))
    }
  }, [dataProfile ])

  const handleEdit = (user: User) => {
    setEditingUser(user.id)
    setEditedRoles(user.roles)
    setEditedStatus(user.status)
  }

  const handleCancel = () => {
    setEditingUser(null)
    setEditedRoles([])
    setEditedStatus('')
  }

  const handleSave = async (userId: string) => {
    try {
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roles: editedRoles,
          status: editedStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccess('User updated successfully')
      setEditingUser(null)
      fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    }
  }
  console.log({isAdmin})

  return (
    // <ProtectedRoute requiredRoles={['admin']}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Usuários da Plataforma</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-6 w-6 mr-2" /> Carregando usuários...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Verificado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={editingUser === user.id ? 'bg-blue-50' : ''}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {editingUser === user.id ? (
                          <Select value={editedStatus} onValueChange={setEditedStatus}>
                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="suspended">Suspenso</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser === user.id ? (
                          <div className="space-y-2">
                            {['admin', 'mentor', 'mentee', 'company', 'recruiter'].map((role) => (
                              <div key={role} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${user.id}-${role}`}
                                  checked={editedRoles.includes(role)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEditedRoles([...editedRoles, role])
                                    } else {
                                      setEditedRoles(editedRoles.filter(r => r !== role))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`${user.id}-${role}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge key={role} variant="secondary">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.email_verified ? "default" : "destructive"}>
                          {user.email_verified ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingUser === user.id ? (
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleSave(user.id)}><Save className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
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
    // </ProtectedRoute>
  )
} 