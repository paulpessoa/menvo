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
    "/admin": [
        { label: "Dashboard" }
    ],
    "/admin/mentors": [
        { label: "Dashboard", href: "/admin" },
        { label: "Mentores" }
    ],
    "/admin/mentors/verify": [
        { label: "Dashboard", href: "/admin" },
        { label: "Mentores", href: "/admin/mentors" },
        { label: "Verificar" }
    ],
    "/admin/users": [
        { label: "Dashboard", href: "/admin" },
        { label: "Usuários" }
    ],
    "/admin/settings": [
        { label: "Dashboard", href: "/admin" },
        { label: "Configurações" }
    ],
    "/admin/reports": [
        { label: "Dashboard", href: "/admin" },
        { label: "Relatórios" }
    ]
}

export function AdminBreadcrumb() {
    const pathname = usePathname()
    const breadcrumbs = routeMap[pathname] || []

    if (breadcrumbs.length === 0) {
        return null
    }

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
            <Link
                href="/admin"
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
                        <span className="text-foreground font-medium">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    )
}