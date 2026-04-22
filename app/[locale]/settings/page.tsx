"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Settings,
  Globe,
  Lock,
  Trash2,
  Moon,
  Sun,
  AlertTriangle
} from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/utils/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const t = useTranslations("settings")
  const commonT = useTranslations("common")
  const { currentLanguage, changeLanguage } = useLanguage()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: commonT("error"),
        description: t("security.mismatch"),
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: commonT("error"),
        description: t("security.minLength"),
        variant: "destructive"
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const supabase = createClient()

      // 1. Re-autenticar o usuário com a senha atual para validar a troca (Padrão de Segurança)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword
      })

      if (signInError) {
        throw new Error(t("security.invalidCurrentPassword") || "Senha atual incorreta")
      }

      // 2. Atualizar para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      toast({
        title: commonT("success"),
        description: t("security.success")
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: commonT("error"),
        description: error.message || t("security.error"),
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Implementar lógica de deletar conta
      toast({
        title: t("dangerZone.deleteButton"),
        description: t("dangerZone.confirmDesc")
      })
      await signOut()
    } catch (error) {
      toast({
        title: commonT("error"),
        description: commonT("error"),
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("tabs.general")}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t("tabs.security")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            {t("tabs.appearance")}
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("language.title")}
              </CardTitle>
              <CardDescription>{t("language.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <Button
                  variant={currentLanguage === "pt-BR" ? "default" : "outline"}
                  onClick={() => changeLanguage("pt-BR")}
                  className="w-full justify-start md:justify-center"
                >
                  🇧🇷 {commonT("portuguese")}
                </Button>
                <Button
                  variant={currentLanguage === "en" ? "default" : "outline"}
                  onClick={() => changeLanguage("en")}
                  className="w-full justify-start md:justify-center"
                >
                  🇺🇸 {commonT("english")}
                </Button>
                <Button
                  variant={currentLanguage === "es" ? "default" : "outline"}
                  onClick={() => changeLanguage("es")}
                  className="w-full justify-start md:justify-center"
                >
                  🇪🇸 {commonT("spanish")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("account.title")}</CardTitle>
              <CardDescription>{t("account.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{t("account.email")}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <Badge variant="default">{t("account.verified")}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("security.title")}
              </CardTitle>
              <CardDescription>{t("security.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  {t("security.currentPassword")}
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("security.currentPasswordPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  {t("security.newPassword")}
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("security.newPasswordPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t("security.confirmPassword")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("security.confirmPasswordPlaceholder")}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="w-full"
              >
                {isChangingPassword
                  ? t("security.changing")
                  : t("security.title")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t("dangerZone.title")}
              </CardTitle>
              <CardDescription>{t("dangerZone.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("dangerZone.deleteButton")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("dangerZone.confirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("dangerZone.confirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("dangerZone.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("dangerZone.confirmAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                {t("appearance.title")}
              </CardTitle>
              <CardDescription>{t("appearance.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="w-full flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  {t("appearance.light")}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="w-full flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  {t("appearance.dark")}
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="w-full flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {t("appearance.system")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
