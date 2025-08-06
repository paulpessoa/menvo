'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { Loader2Icon, MailIcon, LockIcon, BellIcon, LanguagesIcon as LanguageIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { updateEmail, updatePassword } from '@/services/auth/supabase'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/useLanguage'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const { language, changeLanguage } = useLanguage()

  const [newEmail, setNewEmail] = useState(user?.email || '')
  const [emailLoading, setEmailLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [notificationsEnabled, setNotificationsEnabled] = useState(true) // Mock state

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    try {
      if (!newEmail) {
        throw new Error(t('settings.email.validationEmpty'))
      }
      if (newEmail === user?.email) {
        toast({
          title: t('settings.email.noChangeTitle'),
          description: t('settings.email.noChangeDescription'),
          variant: 'default',
        })
        setEmailLoading(false)
        return
      }

      const { error } = await updateEmail(newEmail)
      if (error) {
        throw error
      }
      await refreshUser()
      toast({
        title: t('settings.email.successTitle'),
        description: t('settings.email.successDescription'),
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: t('settings.email.errorTitle'),
        description: error.message || t('settings.email.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    try {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new Error(t('settings.password.validationEmpty'))
      }
      if (newPassword !== confirmNewPassword) {
        throw new Error(t('settings.password.validationMismatch'))
      }
      if (newPassword.length < 6) {
        throw new Error(t('settings.password.validationLength'))
      }

      const { error } = await updatePassword(newPassword) // Supabase updatePassword doesn't require current password
      if (error) {
        throw error
      }
      toast({
        title: t('settings.password.successTitle'),
        description: t('settings.password.successDescription'),
        variant: 'default',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: any) {
      toast({
        title: t('settings.password.errorTitle'),
        description: error.message || t('settings.password.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked)
    toast({
      title: t('settings.notifications.toastTitle'),
      description: checked ? t('settings.notifications.toastEnabled') : t('settings.notifications.toastDisabled'),
      variant: 'default',
    })
    // In a real app, update user preferences in the database
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('settings.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailIcon className="h-5 w-5" /> {t('settings.email.cardTitle')}
              </CardTitle>
              <CardDescription>{t('settings.email.cardDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email.emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    disabled={emailLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={emailLoading}>
