"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  User,
  LogOut,
  Calendar,
  MessageSquare,
  Globe,
  Users,
  Shield,
  UserCheck,
  BarChart3,
  Cog,
  LayoutDashboard,
} from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/lib/auth/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
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
import { useTranslation } from "react-i18next"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const { user, profile, signOut, loading } = useAuth()
  const { permissions } = usePermissions()
  const pathname = usePathname()
  const { currentLanguage, changeLanguage } = useLanguage()

  const isAuthenticated = !!user

  const navigation = [
    { name: t("common.findMentors"), href: "/mentors" },
    { name: t("common.howItWorks"), href: "/how-it-works" },
    { name: t("common.aboutUs"), href: "/about" },
  ]

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meu Perfil", href: "/profile", icon: User },
    { name: "Mensagens", href: "/messages", icon: MessageSquare },
    { name: "Calendário", href: "/calendar", icon: Calendar },
  ]

  const adminNavigation = [
    ...(permissions.includes("system:update-settings") ? [{ name: "Painel Admin", href: "/admin", icon: Shield }] : []),
    ...(permissions.includes("users:list") ? [{ name: "Gerenciar Usuários", href: "/admin/users", icon: Users }] : []),
    ...(permissions.includes("verifications:list")
      ? [{ name: "Verificações", href: "/admin/verifications", icon: UserCheck }]
      : []),
    ...(permissions.includes("volunteer-activities:validate")
      ? [{ name: "Validar Atividades", href: "/admin/validations", icon: UserCheck }]
      : []),
    ...(permissions.includes("reports:view") ? [{ name: "Relatórios", href: "/admin/reports", icon: BarChart3 }] : []),
    ...(permissions.includes("system:update-settings")
      ? [{ name: "Configurações", href: "/admin/settings", icon: Cog }]
      : []),
  ]

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const getAvatarFallback = () => {
    if (profile?.first_name) return profile.first_name[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return "U"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="MENVO" width={120} height={40} priority />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
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

          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    {profile?.role && <p className="text-xs text-muted-foreground capitalize pt-1">{profile.role}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                {adminNavigation.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Administração</DropdownMenuLabel>
                    {adminNavigation.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
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
                <div className="border-t pt-4" />
                {isAuthenticated ? (
                  <>
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
                        <div className="border-t pt-4" />
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
                      </>
                    )}
                    <div className="border-t pt-4" />
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-2 py-1 text-lg justify-start"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Entrar
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        Cadastrar
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
