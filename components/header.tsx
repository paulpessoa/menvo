"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User, LogOut,   Settings, Calendar, MessageSquare ,
  Globe, ChevronDown, Users, Shield 
} from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"


import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { useTranslation } from "react-i18next"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  const { isAuthenticated, user, profile, signOut  } = useAuth()
  const { canAdminSystem } = usePermissions()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { currentLanguage, changeLanguage } = useLanguage()
  const isAdmin = user?.roles?.includes('admin')


  const navigation = [
    { name: t('common.home'), href: "/" },
    { name: t('common.findMentors'), href: "/mentors" },
    // { name: t('common.talents'), href: "/talents" },
    // { name: t('common.events'), href: "/events" },
    { name: t('common.howItWorks'), href: "/how-it-works" },
    { name: t('common.aboutUs'), href: "/about" },
  ]

  const userNavigation = isAuthenticated
    ? [
        { name: "Dashboard", href: "/dashboard", icon: User },
        { name: "Perfil", href: "/profile", icon: Settings },
        ...(canAdminSystem ? [{ name: "Admin", href: "/admin", icon: Shield }] : []),
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
                <span>{currentLanguage === 'en' ? 'EN' : currentLanguage === 'pt-BR' ? 'PT' : 'ES'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                {t('common.english')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('pt-BR')}>
                {t('common.portuguese')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('es')}>
                {t('common.spanish')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Temporarily hidden theme toggle */}
          {/* <ModeToggle /> */}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon" className="rounded-full p-0">
                  <Avatar>
                    <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.profile_picture_url || undefined} alt={user?.first_name || user?.email || "User"} />
                    <AvatarFallback>
                      {user?.first_name ? user.first_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.full_name || "Usuário"}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
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
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-2 py-1 text-lg justify-start"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-4 space-y-2">
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/auth" onClick={() => setIsOpen(false)}>
                        {t('common.login')}
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/auth" onClick={() => setIsOpen(false)}>
                        {t('common.register')}
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
