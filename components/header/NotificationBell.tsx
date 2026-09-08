"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import {
  Bell,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Star,
  CheckCheck,
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { useAuth } from "@/lib/auth"
import { useNotifications } from "@/hooks/useNotifications"
import type {
  InAppNotification,
  NotificationType
} from "@/lib/services/notifications/notifications.service"

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return "Agora mesmo"
  if (diffMin < 60) return `Há ${diffMin} min`
  if (diffHours < 24) return `Há ${diffHours} h`
  if (diffDays === 1) return "Ontem"
  if (diffDays < 7) return `Há ${diffDays} dias`
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "booking_request":
      return (
        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <CalendarClock className="h-4 w-4" />
        </div>
      )
    case "booking_confirmed":
      return (
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <CalendarCheck className="h-4 w-4" />
        </div>
      )
    case "booking_cancelled":
      return (
        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <CalendarX className="h-4 w-4" />
        </div>
      )
    case "pending_evaluation":
      return (
        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
          <Star className="h-4 w-4 fill-amber-500" />
        </div>
      )
  }
}

export function NotificationBell() {
  const router = useRouter()
  const { user, role, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead
  } = useNotifications(user?.id, role)

  if (!isAuthenticated || !user) {
    return null
  }

  const handleNotificationClick = (notification: InAppNotification) => {
    markAsRead(notification.id)
    setOpen(false)
    router.push(notification.actionUrl as any)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Abrir central de notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50 duration-200">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border-border/60 bg-background/95 backdrop-blur-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-foreground tracking-tight">
              Notificações
            </h4>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[11px] font-semibold bg-primary/10 text-primary border-none px-1.5 py-0 h-5"
              >
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar lidas
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
              <div className="h-11 w-11 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-0.5">
                Tudo em dia!
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Você não possui notificações pendentes no momento.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-muted/40 ${
                  !notif.isRead ? "bg-primary/[0.03]" : ""
                }`}
              >
                {getNotificationIcon(notif.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-xs font-semibold leading-tight truncate ${
                        !notif.isRead ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 shrink-0">
                      {formatRelativeTime(notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <span
                    className="h-2 w-2 rounded-full bg-primary shrink-0 self-center"
                    aria-label="Não lida"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/10 text-center">
            <span className="text-[11px] text-muted-foreground">
              Exibindo histórico recente
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
