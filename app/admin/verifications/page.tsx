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
import { Loader2Icon, SearchIcon, RefreshCcwIcon, CheckCircleIcon, XCircleIcon, ExternalLinkIcon } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { fetchPendingVerifications, approveVerification, rejectVerification } from '@/services/admin/verifications'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile } from '@/types/database'
import { useTranslation } from 'react-i18next'

type VerificationRequest = user_profile & {
  email: string;
}

export default function AdminVerificationsPage() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchPendingVerifications()
      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      toast({
        title: t('adminVerifications.fetchErrorTitle'),
        description: error.message || t('adminVerifications.fetchErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleApprove = async (userId: string) => {
    setProcessingUserId(userId)
    try {
      const { error } = await approveVerification(userId)
      if (error) throw error
      toast({
        title: t('adminVerifications.approveSuccessTitle'),
        description: t('adminVerifications.approveSuccessDescription'),
        variant: 'default',
      })
      await loadRequests()
    } catch (error: any) {
      toast({
        title: t('adminVerifications.approveErrorTitle'),
        description: error.message || t('adminVerifications.approveErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleReject = async (userId: string) => {
    setProcessingUserId(userId)
    try {
      const { error } = await rejectVerification(userId)
      if (error) throw error
      toast({
        title: t('adminVerifications.rejectSuccessTitle'),
        description: t('adminVerifications.rejectSuccessDescription'),
        variant: 'default',
      })
      await loadRequests()
    } catch (error: any) {
      toast({
        title: t('adminVerifications.rejectErrorTitle'),
        description: error.message || t('adminVerifications.rejectErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setProcessingUserId(null)
    }
  }

  const filteredRequests = useMemo(() => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((req) => {
        if (filterStatus === 'pending') return !req.verified_at && req.is_profile_complete && req.role === 'mentor'
        if (filterStatus === 'approved') return !!req.verified_at
        // For 'rejected', we'd need a specific field in the DB, assuming it's not verified and not complete
        // For now, we'll just show pending and approved
        return false
      })
    } else {
      // If 'all', show all requests that are either pending or approved
      filtered = filtered.filter(req => req.role === 'mentor' && req.is_profile_complete)
    }

    return filtered
  }, [requests, searchTerm, filterStatus])

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('adminVerifications.title')}
        </h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('adminVerifications.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value: 'pending' | 'approved' | 'rejected' | 'all') => setFilterStatus(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('adminVerifications.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminVerifications.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('adminVerifications.pending')}</SelectItem>
              <SelectItem value="approved">{t('adminVerifications.approved')}</SelectItem>
              {/* <SelectItem value="rejected">{t('adminVerifications.rejected')}</SelectItem> */}
            </SelectContent>
          </Select>
          <Button onClick={loadRequests} variant="outline" disabled={loading}>
            <RefreshCcwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''} mr-2`} />
            {t('adminVerifications.refreshButton')}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2Icon className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('adminVerifications.loadingRequests')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminVerifications.tableHeader.mentorName')}</TableHead>
                  <TableHead>{t('adminVerifications.tableHeader.email')}</TableHead>
                  <TableHead>{t('adminVerifications.tableHeader.profileComplete')}</TableHead>
                  <TableHead>{t('adminVerifications.tableHeader.proofOfExperience')}</TableHead>
                  <TableHead>{t('adminVerifications.tableHeader.status')}</TableHead>
                  <TableHead className="text-right">{t('adminVerifications.tableHeader.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t('adminVerifications.noRequestsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.full_name || req.username || 'N/A'}</TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>
                        {req.is_profile_complete ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {req.proof_of_experience_url ? (
                          <a href={req.proof_of_experience_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            {t('adminVerifications.viewLink')} <ExternalLinkIcon className="h-4 w-4" />
                          </a>
                        ) : (
                          t('adminVerifications.noLink')
                        )}
                      </TableCell>
                      <TableCell>
                        {req.verified_at ? (
                          <span className="text-green-600">{t('adminVerifications.approved')}</span>
                        ) : (
                          <span className="text-yellow-600">{t('adminVerifications.pending')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!req.verified_at && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(req.id)}
                              disabled={processingUserId === req.id}
                            >
                              {processingUserId === req.id ? <Loader2Icon className="animate-spin h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                              <span className="sr-only">{t('adminVerifications.approve')}</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(req.id)}
                              disabled={processingUserId === req.id}
                            >
                              {processingUserId === req.id ? <Loader2Icon className="animate-spin h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                              <span className="sr-only">{t('adminVerifications.reject')}</span>
                            </Button>
                          </div>
                        )}
                        {req.verified_at && (
                          <span className="text-muted-foreground text-sm">{t('adminVerifications.actionTaken')}</span>
                        )}
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
