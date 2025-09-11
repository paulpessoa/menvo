"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    CheckCircle,
    Clock,
    Settings,
    BarChart3,
    Shield,
    Menu,
    X,
    Home,
    UserCheck,
    FileText
} from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
    children: React.ReactNode
}

const adminNavItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: Home,
        description: "Visão geral da plataforma"
    },
    {
        title: "Gerenciar Mentores",
        href: "/admin/mentors",
        icon: CheckCircle,
        description: "Visualizar e verificar mentores"
    },
    {
        title: "Verificar Mentores",
        href: "/admin/mentors/verify",
        icon: Clock,
        description: "Aprovar mentores pendentes"
    },
    {
        title: "Gerenciar Usuários",
        href: "/admin/users",
        icon: Users,
        description: "Todos os usuários da plataforma"
    },
    {
        title: "Relatórios",
        href: "/admin/reports",
        icon: BarChart3,
        description: "Estatísticas e métricas"
    },
    {
        title: "Configurações",
        href: "/admin/settings",
        icon: Settings,
        description: "Configurações da plataforma"
    }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === "/admin") {
            return pathname === "/admin"
        }
        return pathname.startsWith(href)
    }

    return (
        <RequireRole roles={['admin']}>
            <div className="min-h-screen bg-gray-50">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <Shield className="h-6 w-6 text-red-600" />
                                <span className="font-semibold text-lg">Admin Panel</span>
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
                                    href={item.href}
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
                                            Acesso Admin
                                        </span>
                                    </div>
                                    <p className="text-xs text-red-700">
                                        Você tem privilégios administrativos
                                    </p>
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
                            <span className="font-semibold">Admin Panel</span>
                        </div>
                        <div /> {/* Spacer */}
                    </div>

                    {/* Page content */}
                    <main className="min-h-screen">
                        {children}
                    </main>
                </div>
            </div>
        </RequireRole>
    )
}