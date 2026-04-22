"use client"

import { useState } from "react"
import { Link, usePathname } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  BarChart3,
  Shield,
  Menu,
  X,
  Home,
  Building2,
  MessageSquare,
  Star
} from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const t = useTranslations("admin")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const adminNavItems = [
    {
      title: t("nav.dashboard"),
      href: "/dashboard/admin",
      icon: Home,
      description: t("nav.dashboardDesc")
    },
    {
      title: t("nav.organizations"),
      href: "/dashboard/admin/organizations",
      icon: Building2,
      description: t("nav.organizationsDesc")
    },
    {
      title: t("nav.users"),
      href: "/dashboard/admin/users",
      icon: Users,
      description: t("nav.usersDesc")
    },
    {
      title: "Feedbacks",
      href: "/dashboard/admin/feedbacks",
      icon: Star,
      description: "Voz da comunidade"
    },
    {
      title: t("nav.reports"),
      href: "/dashboard/admin/reports",
      icon: BarChart3,
      description: t("nav.reportsDesc")
    }
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <RequireRole roles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)]",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-600" />
                <span className="font-semibold text-lg">{t("title")}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      {t("nav.dashboard")}
                    </span>
                  </div>
                  <p className="text-xs text-red-700">{t("description")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span className="font-semibold">{t("title")}</span>
            </div>
            <div /> {/* Spacer */}
          </div>

          {/* Page content */}
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </RequireRole>
  )
}
