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
  Loader2,
  ChevronRight,
  Info
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { LanguageSelector } from "./LanguageSelector"
import { MessagesBadge } from "./MessagesBadge"
import { Separator } from "@/components/ui/separator"

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
    { name: t("common.aboutUs"), href: "/about" }, // Restaurado
    { name: t("common.howItWorks"), href: "/how-it-works" },
  ]

  const userNavigation = isAuthenticated
    ? [
        ...(isAdmin()
          ? [
              {
                name: t("header.userMenu.adminPanel"),
                href: "/admin",
                icon: Shield,
                color: "text-red-600"
              }
            ]
          : []),
        {
          name: t("header.userMenu.dashboard"),
          href: "/dashboard",
          icon: LayoutDashboard,
          color: "text-primary"
        },
        {
          name: t("header.userMenu.profile"),
          href: "/profile",
          icon: User,
          color: "text-gray-700"
        },
        ...(isAdmin() || role === "mentor"
          ? [
              {
                name: t("header.userMenu.createOrganization"),
                href: "/organizations/new",
                icon: Building2,
                color: "text-gray-700"
              }
            ]
          : []),
        {
          name: t("header.userMenu.messages"),
          href: "/messages",
          icon: MessageSquare,
          color: "text-gray-700"
        },
        {
          name: t("header.userMenu.settings"),
          href: "/settings",
          icon: Settings,
          color: "text-gray-700"
        }
      ]
    : []

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
        <nav className="hidden lg:flex w-2/4 justify-center items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  pathname === item.href
                    ? "text-primary border-b-2 border-primary py-1"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
        </nav>

        {/* Direita: Ferramentas */}
        <div className="w-3/4 lg:w-1/4 flex justify-end items-center gap-2">
          <LanguageSelector />
          <MessagesBadge />

          {loading ? (
            <div className="h-9 w-9 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isAuthenticated ? (
            <div className="hidden md:block">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border shadow-sm">
                    <Avatar className="h-full w-full">
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
                <DropdownMenuContent className="w-64 p-2" align="end">
                    <DropdownMenuLabel className="font-normal px-2 py-3">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-bold leading-none">{profile?.full_name || t("header.userMenu.user")}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            <Badge variant="secondary" className="w-fit mt-2 text-[10px] uppercase tracking-wider">
                                {role === 'admin' ? 'Administrador' : role === 'mentor' ? 'Mentor' : 'Mentorado'}
                            </Badge>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild className="cursor-pointer rounded-md">
                        <Link href={item.href} className="flex items-center gap-3 py-2">
                        <item.icon className={`h-4 w-4 ${item.color || ''}`} />
                        <span className="font-medium">{item.name}</span>
                        </Link>
                    </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer rounded-md">
                    <LogOut className="h-4 w-4 mr-2" /> {t("header.userMenu.logout")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild size="sm">
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild size="sm" className="shadow-md">
                <Link href="/signup">{t("common.register")}</Link>
              </Button>
            </div>
          )}

          {/* Hamburger Mobile */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
              <SheetHeader className="p-6 text-left border-b bg-muted/20">
                <SheetTitle className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                    {profile?.full_name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg leading-tight truncate max-w-[180px]">{profile?.full_name || "Membro"}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">{user?.email}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative h-8 w-24">
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
                    )}
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Navegação</p>
                    {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                            pathname === item.href ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-muted"
                        }`}
                        onClick={() => setIsOpen(false)}
                    >
                        {item.name}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                    </Link>
                    ))}
                </div>

                {isAuthenticated && (
                    <>
                        <Separator className="my-2" />
                        <div className="p-4 space-y-1">
                            <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Minha Conta</p>
                            {userNavigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-4 px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-muted transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <item.icon className={`h-5 w-5 ${item.color || ''}`} />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {!isAuthenticated && (
                    <div className="p-6 mt-auto border-t space-y-3">
                        <Button className="w-full h-12 text-lg shadow-lg" asChild onClick={() => setIsOpen(false)}>
                            <Link href="/signup">{t("common.register")}</Link>
                        </Button>
                        <Button variant="outline" className="w-full h-12 text-lg" asChild onClick={() => setIsOpen(false)}>
                            <Link href="/login">{t("common.login")}</Link>
                        </Button>
                    </div>
                )}
              </div>

              {isAuthenticated && (
                <div className="p-4 border-t bg-muted/10 mt-auto">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-5 w-5" /> {t("header.userMenu.logout")}
                    </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
