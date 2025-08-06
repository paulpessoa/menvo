"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, Bell, Globe, User, LogOut } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/hooks/useLanguage"

export default function SettingsPage() {
  const { t } = useTranslation()
  const { changeLanguage } = useLanguage()
  const { user, loading: authLoading, signOut, updateUserEmail, updateUserPassword } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true) // Mock state
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/unauthorized")
    }
    if (user) {
      setEmail(user.email || "")
    }
  }, [user, authLoading, router])

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEmailSubmitting(true)
    try {
      const { error } = await updateUserEmail(email)
      if (error) throw error
      toast({
        title: t('settings.email.successTitle'),
        description: t('settings.email.successDescription'),
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: t('settings.email.errorTitle'),
        description: error.message || t('settings.email.errorMessage'),
        variant: "destructive",
      })
    } finally {
      setIsEmailSubmitting(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPasswordSubmitting(true)

    if (newPassword !== confirmNewPassword) {
      toast({
        title: t('settings.password.matchErrorTitle'),
        description: t('settings.password.matchErrorDescription'),
        variant: "destructive",
      })
      setIsPasswordSubmitting(false)
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: t('settings.password.lengthErrorTitle'),
        description: t('settings.password.lengthErrorDescription'),
        variant: "destructive",
      })
      setIsPasswordSubmitting(false)
      return
    }

    try {
      const { error } = await updateUserPassword(newPassword)
      if (error) throw error
      toast({
        title: t('settings.password.successTitle'),
        description: t('settings.password.successDescription'),
        variant: "default",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (error: any) {
      toast({
        title: t('settings.password.errorTitle'),
        description: error.message || t('settings.password.errorMessage'),
        variant: "destructive",
      })
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    changeLanguage(lang)
    toast({
      title: t('settings.language.successTitle'),
      description: t('settings.language.successDescription', { lang: lang.toUpperCase() }),
      variant: "default",
    })
  }

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-8 text-center">
          {t('settings.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('settings.profile.title')}
              </CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/profile")}>
                {t('settings.profile.button')}
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('settings.account.title')}
              </CardTitle>
              <CardDescription>{t('settings.account.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Update */}
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <h3 className="text-lg font-semibold">{t('settings.email.title')}</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email.label')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isEmailSubmitting}>
                  {isEmailSubmitting ? t('settings.email.submitting') : t('settings.email.button')}
                </Button>
              </form>

              <Separator />

              {/* Password Update */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <h3 className="text-lg font-semibold">{t('settings.password.title')}</h3>
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t('settings.password.currentLabel')}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('settings.password.currentPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('settings.password.newLabel')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={t('settings.password.newPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">{t('settings.password.confirmLabel')}</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder={t('settings.password.confirmPlaceholder')}
                  />
                </div>
                <Button type="submit" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? t('settings.password.submitting') : t('settings.password.button')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('settings.notifications.title')}
              </CardTitle>
              <CardDescription>{t('settings.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-toggle">{t('settings.notifications.toggleLabel')}</Label>
                <Switch
                  id="notifications-toggle"
                  checked={isNotificationsEnabled}
                  onCheckedChange={setIsNotificationsEnabled}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isNotificationsEnabled ? t('settings.notifications.enabled') : t('settings.notifications.disabled')}
              </p>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.language.title')}
              </CardTitle>
              <CardDescription>{t('settings.language.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language-select">{t('settings.language.label')}</Label>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder={t('settings.language.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                {t('settings.logout.title')}
              </CardTitle>
              <CardDescription>{t('settings.logout.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                {t('settings.logout.button')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
