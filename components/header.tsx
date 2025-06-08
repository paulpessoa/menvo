"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X, User, LogOut,   Settings, Calendar, MessageSquare ,
  Globe, ChevronDown, Users, 
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguage()
  const { user, isAuthenticated, logout } = useAuth()
  const isAdmin = user?.roles?.includes('admin')
  const navigation = [
    { name: t('common.home'), href: "/" },
    { name: t('common.findMentors'), href: "/mentors" },
    // { name: t('common.talents'), href: "/talents" },
    // { name: t('common.events'), href: "/events" },
    { name: t('common.howItWorks'), href: "/how-it-works" },
    { name: t('common.aboutUs'), href: "/about" },
  ]

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

        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Change Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('en')} className="flex items-center gap-2">
                <Image src="/flags/us.svg" alt="English" width={20} height={15} />
                <span className="sr-only">{t('common.english')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('pt-BR')} className="flex items-center gap-2">
                <Image src="/flags/br.svg" alt="Português" width={20} height={15} />
                <span className="sr-only">{t('common.portuguese')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('es')} className="flex items-center gap-2">
                <Image src="/flags/es.svg" alt="Español" width={20} height={15} />
                <span className="sr-only">{t('common.spanish')}</span>
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild disabled>
                  <Link href="/mentorship">
                    <MessageSquare className="mr-2 h-4 w-4" /> Mentoria
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild disabled>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild disabled>
                  <Link href="/calendar">
                    <Calendar className="mr-2 h-4 w-4" /> Calendar
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (<>
                  <DropdownMenuItem asChild>
                  <Link href="/admin">Painel Admin</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/validations">Validações</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/subscriptions">Assinaturas</Link>
                </DropdownMenuItem>
                </>
                )}
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('common.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t('common.register')}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-4">
          <ModeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                    pathname === item.href ? "text-primary-600" : "text-foreground/60"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Button variant="ghost" size="sm" asChild className="w-full justify-center">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>{t('common.login')}</Link>
                </Button>
                <Button size="sm" asChild className="w-full justify-center">
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>{t('common.register')}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Link href="/profile" className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
                <Link href="/mentorship" className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Mentoria
                </Link>
                <Link href="/settings" className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
                <Link href="/calendar" className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>
                  <Calendar className="mr-2 h-4 w-4" /> Calendar
                </Link>
                <button 
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }} 
                  className="flex items-center px-2 py-2 text-sm text-red-600 hover:bg-accent rounded-md"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
