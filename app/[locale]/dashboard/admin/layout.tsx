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
  Home,
  Building2,
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

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <RequireRole roles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="min-h-screen">{children}</main>
      </div>
    </RequireRole>
  )
}
