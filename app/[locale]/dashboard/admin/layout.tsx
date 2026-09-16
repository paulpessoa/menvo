"use client"

import { RequireRole } from "@/lib/auth/auth-guard"

interface AdminLayoutProps {
  children: React.ReactNode
}

/**
 * Layout base para todas as páginas da área administrativa.
 * Garante proteção por role 'admin' e fundo padrão da aplicação.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <RequireRole roles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </RequireRole>
  )
}

