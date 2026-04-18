"use client"

import { useState } from "react"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import Image from "next/image"
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
  LayoutDashboard,
  Building2,
  Plus,
  Search,
  Bell,
  Loader2
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { LanguageSelector } from "./LanguageSelector"
import { MessagesBadge } from "./MessagesBadge"

export default function Header() {
  const { user, profile, isAuthenticated, loading, role, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations()

  const navigation = [
    { name: t("common.home"), href: "/" },
    { name: t("common.findMentors"), href: "/mentors" },
    { name: t("common.community"), href: "/community" },
    { name: t("common.hub"), href: "/hub" },
    { name: t("common.howItWorks"), href: "/how-it-works" },
  ]

  // Montagem estável do menu de usuário para evitar erros de iterabilidade
  const userNavigation = []
  
  if (isAuthenticated && profile) {
    if (isAdmin()) {
        userNavigation.push({ name: t("header.userMenu.adminPanel"), href: "/admin", icon: Shield })
    }
    userNavigation.push({ name: t("header.userMenu.dashboard"), href: "/dashboard", icon: LayoutDashboard })
    userNavigation.push({ name: t("header.userMenu.profile"), href: "/profile", icon: User })
    
    if (isAdmin() || role === "mentor") {
        userNavigation.push({ name: t("header.userMenu.createOrganization"), href: "/organizations/new", icon: Building2 })
    }
    
    userNavigation.push({ name: t("header.userMenu.messages"), href: "/messages", icon: MessageSquare })
    userNavigation.push({ name: t("header.userMenu.settings"), href: "/settings", icon: Settings })
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        {/* Esquerda: Logo */}
        <div className="w-1/4 flex justify-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-32">
                <Image
                    src="/menvo-logo-light.png"
                    alt="Menvo"
                    fill
                    className="object-contain dark:hidden"
                    priority
                />
                <Image
                    src="/menvo-logo-dark.png"
                    alt="Menvo"
                    fill
                    className="object-contain hidden dark:block"
                    priority
                />
            </div>
          </Link>
        </div>

        {/* Centro: Navegação Centralizada */}
        <nav className="hidden md:flex w-2/4 justify-center items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  pathname === item.href
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
        </nav>

        {/* Direita: Ferramentas */}
        <div className="w-1/4 flex justify-end items-center gap-2">
          <LanguageSelector />
          <MessagesBadge />

          {loading ? (
            <div className="h-9 w-9 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || profile?.avatar_url}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {profile?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || t("header.userMenu.user")}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> {t("header.userMenu.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">{t("common.register")}</Link>
              </Button>
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t pt-4 mt-2">
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 py-2 text-lg font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                  {isAuthenticated && (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 py-2 text-lg font-medium text-red-600"
                    >
                      <LogOut className="h-5 w-5" /> {t("header.userMenu.logout")}
                    </button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
