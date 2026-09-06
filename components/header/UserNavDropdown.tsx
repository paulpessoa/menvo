"use client"

import { Link } from "@/i18n/routing"
import { LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserNavigationItem } from "./types"

interface UserNavDropdownProps {
  displayName: string
  displayInitial: string
  email?: string
  avatarUrl?: string | null
  isAdmin?: boolean
  role?: string | null
  userNavigation: UserNavigationItem[]
  onSignOut: () => void
}

export function UserNavDropdown({
  displayName,
  displayInitial,
  email,
  avatarUrl,
  isAdmin,
  role,
  userNavigation,
  onSignOut
}: UserNavDropdownProps) {
  const t = useTranslations()

  return (
    <div className="hidden md:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 border shadow-sm"
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {displayInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2" align="end">
          <DropdownMenuLabel className="font-normal px-2 py-3">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
              <Badge
                variant="secondary"
                className="w-fit mt-2 text-[10px] uppercase tracking-wider"
              >
                {isAdmin
                  ? "Administrador"
                  : role === "mentor"
                    ? "Mentor"
                    : "Mentorado"}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {userNavigation.map((item, index) =>
            item.type === "separator" ? (
              <DropdownMenuSeparator key={`sep-${index}`} />
            ) : (
              <DropdownMenuItem
                key={item.name}
                asChild
                className="cursor-pointer rounded-md"
              >
                <Link href={item.href} className="flex items-center gap-3 py-2">
                  {item.icon && <item.icon className={`h-4 w-4 ${item.color || ""}`} />}
                  <span className="font-medium">{item.name}</span>
                </Link>
              </DropdownMenuItem>
            )
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onSignOut()
            }}
            onClick={onSignOut}
            className="text-red-600 focus:text-red-600 cursor-pointer rounded-md"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("header.userMenu.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
