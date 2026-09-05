"use client"

import { useState } from "react"
import { Link, usePathname } from "@/i18n/routing"
import Image from "next/image"
import {
  User,
  Settings,
  MessageSquare,
  Shield,
  LayoutDashboard,
  Loader2,
  Heart
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { LanguageSelector } from "./LanguageSelector"
import { MessagesBadge } from "./MessagesBadge"
import { UserNavDropdown } from "./header/UserNavDropdown"
import { MobileNavSheet } from "./header/MobileNavSheet"
import { UserNavigationItem } from "./header/types"

export default function Header() {
  const { user, profile, isAuthenticated, loading, role, isAdmin, signOut } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations()

  const navigation = [
    { name: t("common.home"), href: "/" },
    { name: t("common.findMentors"), href: "/mentors" },
    { name: t("common.aboutUs"), href: "/about" },
    { name: t("common.howItWorks"), href: "/how-it-works" }
  ]

  const userNavigation: UserNavigationItem[] = []

  if (isAuthenticated) {
    userNavigation.push({
      name: t("header.userMenu.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      color: "text-primary"
    })
    userNavigation.push({
      name: t("header.userMenu.profile"),
      href: "/profile",
      icon: User,
      color: "text-gray-700"
    })
    userNavigation.push({
      name: t("header.userMenu.messages"),
      href: "/messages",
      icon: MessageSquare,
      color: "text-gray-700"
    })
    userNavigation.push({
      name: t("header.userMenu.settings"),
      href: "/settings",
      icon: Settings,
      color: "text-gray-700"
    })

    if (isAdmin) {
      userNavigation.push({ type: "separator" })
      userNavigation.push({
        name: "Gerenciar Usuários",
        href: "/dashboard/admin/users",
        icon: User,
        color: "text-amber-600"
      })
      userNavigation.push({
        name: "Feature Flags",
        href: "/dashboard/admin/feature-flags",
        icon: Shield,
        color: "text-amber-600"
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Usuário"

  const displayInitial = (
    profile?.full_name?.[0] ||
    user?.user_metadata?.full_name?.[0] ||
    user?.user_metadata?.first_name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase()

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

        {/* Direita: Ferramentas e Usuário */}
        <div className="w-3/4 lg:w-1/4 flex justify-end items-center gap-2">
          <LanguageSelector />

          {isAuthenticated && role === "mentee" && (
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-red-500 transition-colors"
              asChild
            >
              <Link href="/dashboard/mentee">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Favoritos</span>
              </Link>
            </Button>
          )}

          <MessagesBadge />

          {loading ? (
            <div className="h-9 w-9 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isAuthenticated ? (
            <UserNavDropdown
              displayName={displayName}
              displayInitial={displayInitial}
              email={user?.email}
              avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
              isAdmin={isAdmin}
              role={role}
              userNavigation={userNavigation}
              onSignOut={handleSignOut}
            />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" className="shadow-md rounded-xl font-bold px-6">
                <Link href="/login">{t("common.login")}</Link>
              </Button>
            </div>
          )}

          {/* Drawer Mobile */}
          <MobileNavSheet
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            isAuthenticated={isAuthenticated}
            displayName={displayName}
            displayInitial={displayInitial}
            email={user?.email}
            avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
            navigation={navigation}
            userNavigation={userNavigation}
            currentPathname={pathname}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  )
}
