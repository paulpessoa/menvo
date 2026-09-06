"use client"

import { Link } from "@/i18n/routing"
import Image from "next/image"
import { Menu, LogOut, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { UserNavigationItem } from "./types"

interface NavigationLinkItem {
  name: string
  href: string
}

interface MobileNavSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isAuthenticated: boolean
  displayName: string
  displayInitial: string
  email?: string
  avatarUrl?: string | null
  navigation: NavigationLinkItem[]
  userNavigation: UserNavigationItem[]
  currentPathname: string
  onSignOut: () => void
}

export function MobileNavSheet({
  isOpen,
  onOpenChange,
  isAuthenticated,
  displayName,
  displayInitial,
  email,
  avatarUrl,
  navigation,
  userNavigation,
  currentPathname,
  onSignOut
}: MobileNavSheetProps) {
  const t = useTranslations()

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[350px] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 text-left border-b bg-muted/20">
          <SheetDescription className="sr-only">
            Menu de navegação da plataforma
          </SheetDescription>
          <SheetTitle className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {displayInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight truncate max-w-[180px]">
                    {displayName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {email}
                  </span>
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
            <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Navegação
            </p>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                  currentPathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-muted"
                }`}
                onClick={() => onOpenChange(false)}
              >
                {item.name}
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            ))}
          </div>

          {isAuthenticated && userNavigation.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="p-4 space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Minha Conta
                </p>
                {userNavigation.map((item, index) =>
                  item.type === "separator" ? (
                    <Separator key={`mobile-sep-${index}`} className="my-1" />
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-4 px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-muted transition-colors"
                      onClick={() => onOpenChange(false)}
                    >
                      {item.icon && (
                        <item.icon className={`h-5 w-5 ${item.color || ""}`} />
                      )}
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="p-6 mt-auto border-t space-y-3">
              <Button
                className="w-full h-12 text-lg shadow-lg rounded-xl font-bold"
                asChild
                onClick={() => onOpenChange(false)}
              >
                <Link href="/login">{t("common.login")}</Link>
              </Button>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="p-4 border-t bg-muted/10 mt-auto">
            <button
              onClick={() => {
                onOpenChange(false)
                onSignOut()
              }}
              className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" /> {t("header.userMenu.logout")}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
