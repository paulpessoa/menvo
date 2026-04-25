"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

const routeMap: Record<string, BreadcrumbItem[]> = {
  "/dashboard/admin": [{ label: "Dashboard" }],
  "/dashboard/admin/mentors": [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Mentores" }
  ],
  "/dashboard/admin/mentors/verify": [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Mentores", href: "/dashboard/admin/mentors" },
    { label: "Verificar" }
  ],
  "/dashboard/admin/users": [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Usuários" }
  ],
  "/settings": [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Configurações" }
  ],
  "/dashboard/admin/reports": [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Relatórios" }
  ],
  "/dashboard/admin/feedbacks": [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Feedbacks" }
  ]
}

export function AdminBreadcrumb() {
  const pathname = usePathname()

  // Handle localized paths by removing the locale prefix (e.g., /fr/admin -> /admin)
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?\//, "/")
  
  let breadcrumbs = routeMap[normalizedPathname] || []


  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link
        href="/dashboard/admin"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
