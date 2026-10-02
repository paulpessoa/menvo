"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState } from "react"
import { Link, usePathname } from "@/i18n/routing"
import Image from "next/image"
import { User, Shield, LayoutDashboard, Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { LanguageSelector } from "./LanguageSelector"
import { MessagesBadge } from "./MessagesBadge"
import { NotificationBell } from "./header/NotificationBell"
import { UserNavDropdown } from "./header/UserNavDropdown"
import { MobileNavSheet } from "./header/MobileNavSheet"
import { UserNavigationItem } from "./header/types"
import { useFeatureFlag } from "@/lib/feature-flags"

export default function Header() {
  const { user, profile, isAuthenticated, loading, role, isAdmin, signOut } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations()
  const isChatEnabled = useFeatureFlag("chat_flag")
  const isAssistantEnabled = useFeatureFlag("ai_assistant_flag")

  const navigation = [
    { name: t("common.home"), href: "/" },
    { name: t("common.findMentors"), href: "/mentors" }
  ]

  if (isAuthenticated) {
    if (role === "mentor" || isAdmin) {
      navigation.push({ name: "Comunidade", href: "/community" })
    }
    if (isAssistantEnabled) {
      navigation.push({ name: "Assistente", href: "/assistant" })
    }
  }

  navigation.push(
    { name: t("common.aboutUs"), href: "/about" },
    { name: t("common.howItWorks"), href: "/how-it-works" }
  )

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
    // Link de suporte removido dos menus principais a pedido do usuário
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
              id={`tour-nav-${item.href.replace(/\//g, "") || "home"}`}
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

          {/* Heart button was removed per user request */}

          {isChatEnabled && <MessagesBadge />}
          <NotificationBell />

          {loading ? (
            <div className="h-9 w-9 flex items-center justify-center">
              <MenvoDots />
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
            <div className="hidden lg:flex items-center gap-2">
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
