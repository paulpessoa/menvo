'use client'

import { useEffect, useState } from 'react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { UserRole, UserStatus, Database } from '@/types/database'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
}

export default function AdminUsersPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthLoading) {
      // Check if user is an admin
      const supabase = createServiceRoleClient() // Use service role client for admin checks on server
      supabase.from('profiles').select('role').eq('id', user?.id).single()
        .then(({ data, error }) => {
          if (error || data?.role !== 'admin') {
            router.push('/unauthorized') // Redirect if not admin
          } else {
            fetchUsers()
          }
        })
    }
  }, [isAuthLoading, user, router])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: UserProfile[] = await response.json()
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: 'Error',
        description: `Failed to fetch users: ${err.message}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, role: newRole }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedUser: UserProfile = await response.json()
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: updatedUser.role } : u))
      )
      toast({
        title: 'Success',
        description: `User ${updatedUser.full_name}'s role updated to ${updatedUser.role}.`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to update role: ${err.message}`,
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedUser: UserProfile = await response.json()
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, status: updatedUser.status } : u))
      )
      toast({
        title: 'Success',
        description: `User ${updatedUser.full_name}'s status updated to ${updatedUser.status}.`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${err.message}`,
        variant: 'destructive',
      })
    }
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Admin User Management</h1>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin User Management</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select value={user.role} onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentee">Mentee</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={user.status} onValueChange={(value: UserStatus) => handleStatusChange(user.id, value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
