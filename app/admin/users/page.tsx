'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { UserProfile, user_role } from '@/types/database' // Assuming UserProfile type

export default function AdminUsersPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login') // Redirect unauthenticated users
    } else if (!authLoading && user && !isAdmin) {
      router.push('/unauthorized') // Redirect non-admin users
    }
  }, [user, authLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: UserProfile[] = await response.json()
      setUsers(data)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast({
        title: 'Error',
        description: `Failed to fetch users: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    setUpdatingUserId(userId)
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, updates }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const updatedUser: UserProfile = await response.json()
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u))
      )
      toast({
        title: 'Success',
        description: 'User updated successfully.',
      })
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast({
        title: 'Error',
        description: `Failed to update user: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading or unauthorized...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <p>Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Profile Complete</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.full_name || 'N/A'}</TableCell>
                    <TableCell>{u.username || 'N/A'}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(value: user_role) => handleUpdateUser(u.id, { role: value })}
                        disabled={updatingUserId === u.id}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mentee">Mentee</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`profile-complete-${u.id}`}
                          checked={u.is_profile_complete}
                          onCheckedChange={(checked) => handleUpdateUser(u.id, { is_profile_complete: checked })}
                          disabled={updatingUserId === u.id}
                        />
                        <Label htmlFor={`profile-complete-${u.id}`}>
                          {u.is_profile_complete ? 'Yes' : 'No'}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Add more actions here if needed, e.g., delete user */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/profile/${u.slug || u.id}`)}
                      >
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
