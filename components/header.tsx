"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  User,
  LogOut,
  Settings,
  Calendar,
  MessageSquare,
  Globe,
  Users,
  Shield,
  UserCheck,
  BarChart3,
  Cog,
} from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { useTranslation } from "react-i18next"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  const { isAuthenticated, user, profile, signOut } = useAuth()
  const { canAdminSystem, canAdminUsers, canAdminVerifications, canValidateActivities, canViewReports, isAdmin } =
    usePermissions()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { currentLanguage, changeLanguage } = useLanguage()

  const navigation = [
    { name: t("common.home"), href: "/" },
    { name: t("common.findMentors"), href: "/mentors" },
    { name: t("common.howItWorks"), href: "/how-it-works" },
    { name: t("common.aboutUs"), href: "/about" },
  ]

  const userNavigation = isAuthenticated
    ? [
        { name: "Dashboard", href: "/dashboard", icon: User },
        { name: "Perfil", href: "/profile", icon: Settings },
        { name: "Mensagens", href: "/messages", icon: MessageSquare },
        { name: "Calendário", href: "/calendar", icon: Calendar },
      ]
    : []

  const adminNavigation =
    isAuthenticated && (canAdminSystem || canAdminUsers || canAdminVerifications)
      ? [
          ...(canAdminSystem ? [{ name: "Painel Admin", href: "/admin", icon: Shield }] : []),
          ...(canAdminUsers ? [{ name: "Gerenciar Usuários", href: "/admin/users", icon: Users }] : []),
          ...(canAdminVerifications ? [{ name: "Verificações", href: "/admin/verifications", icon: UserCheck }] : []),
          ...(canValidateActivities
            ? [{ name: "Validar Atividades", href: "/admin/validations", icon: UserCheck }]
            : []),
          ...(canViewReports ? [{ name: "Relatórios", href: "/admin/reports", icon: BarChart3 }] : []),
          ...(canAdminSystem ? [{ name: "Configurações", href: "/admin/settings", icon: Cog }] : []),
        ]
      : []

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="MENVO" width={120} height={40} priority />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                pathname === item.href ? "text-primary-600" : "text-foreground/60"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Globe className="h-4 w-4" />
                <span>{currentLanguage === "en" ? "EN" : currentLanguage === "pt-BR" ? "PT" : "ES"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage("en")}>{t("common.english")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("pt-BR")}>{t("common.portuguese")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("es")}>{t("common.spanish")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0">
                  <Avatar>
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || profile?.avatar_url}
                      alt={profile?.full_name || user?.email || "User"}
                    />
                    <AvatarFallback>
                      {profile?.full_name?.[0]?.toUpperCase() ||
                        user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.full_name || user?.user_metadata?.full_name || "Usuário"}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                    {profile?.role && <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />

                {/* User Navigation */}
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}

                {/* Admin Navigation */}
                {adminNavigation.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Administração</DropdownMenuLabel>
                    {adminNavigation.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Cadastrar</Link>
              </Button>
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-2 py-1 text-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <div className="border-t pt-4">
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-2 px-2 py-1 text-lg"
                          onClick={() => setIsOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      ))}

                      {adminNavigation.length > 0 && (
                        <>
                          <div className="border-t pt-2 mt-2">
                            <p className="px-2 py-1 text-sm font-medium text-muted-foreground">Administração</p>
                            {adminNavigation.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-2 px-2 py-1 text-lg"
                                onClick={() => setIsOpen(false)}
                              >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-2 py-1 text-lg justify-start mt-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-4 space-y-2">
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        {t("common.login")}
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        {t("common.register")}
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
