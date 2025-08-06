'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon, SearchIcon, RefreshCcwIcon, UserCheckIcon, UserXIcon } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { fetchAllUsers, updateUserRole } from '@/services/admin/users'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile, user_role } from '@/types/database'
import { useTranslation } from 'react-i18next'

type UserWithProfile = user_profile & {
  email: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<user_role | 'all'>('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchAllUsers()
      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast({
        title: t('adminUsers.fetchErrorTitle'),
        description: error.message || t('adminUsers.fetchErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: user_role) => {
    setUpdatingUserId(userId)
    try {
      const { error } = await updateUserRole(userId, newRole)
      if (error) throw error
      toast({
        title: t('adminUsers.updateSuccessTitle'),
        description: t('adminUsers.updateSuccessDescription', { role: t(`roles.${newRole}`) }),
        variant: 'default',
      })
      await loadUsers() // Reload users to reflect changes
    } catch (error: any) {
      toast({
        title: t('adminUsers.updateErrorTitle'),
        description: error.message || t('adminUsers.updateErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((user) => user.role === filterRole)
    }

    return filtered
  }, [users, searchTerm, filterRole])

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('adminUsers.title')}
        </h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('adminUsers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={(value: user_role | 'all') => setFilterRole(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('adminUsers.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminUsers.allRoles')}</SelectItem>
              <SelectItem value="mentee">{t('roles.mentee')}</SelectItem>
              <SelectItem value="mentor">{t('roles.mentor')}</SelectItem>
              <SelectItem value="admin">{t('roles.admin')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadUsers} variant="outline" disabled={loading}>
            <RefreshCcwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''} mr-2`} />
            {t('adminUsers.refreshButton')}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2Icon className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('adminUsers.loadingUsers')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminUsers.tableHeader.name')}</TableHead>
                  <TableHead>{t('adminUsers.tableHeader.email')}</TableHead>
                  <TableHead>{t('adminUsers.tableHeader.role')}</TableHead>
                  <TableHead>{t('adminUsers.tableHeader.profileComplete')}</TableHead>
                  <TableHead>{t('adminUsers.tableHeader.verified')}</TableHead>
                  <TableHead className="text-right">{t('adminUsers.tableHeader.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t('adminUsers.noUsersFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || user.username || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role || 'mentee'}
                          onValueChange={(newRole: user_role) => handleRoleChange(user.id, newRole)}
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-[120px] capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mentee">{t('roles.mentee')}</SelectItem>
                            <SelectItem value="mentor">{t('roles.mentor')}</SelectItem>
                            <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.is_profile_complete ? (
                          <UserCheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <UserXIcon className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.verified_at ? (
                          <UserCheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <UserXIcon className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/profile/${user.id}`}>{t('adminUsers.viewProfile')}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
