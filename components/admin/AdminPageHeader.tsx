import type { ReactNode } from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

interface AdminPageHeaderProps {
  title: string
  description?: string
  /** Page-level controls (filters, refresh, create) aligned to the right of the title. */
  actions?: ReactNode
  /** The dashboard itself hides it; every other admin page keeps it. */
  showBack?: boolean
}

/**
 * The one header every /dashboard/admin page uses. Before it, each page had
 * its own title size, icon and back-link style (or none), so moving between
 * admin screens felt like switching products. Text only by design: no title
 * icons, per the button/minimalism rules in docs/STATUS.md.
 */
export function AdminPageHeader({ title, description, actions, showBack = true }: AdminPageHeaderProps) {
  return (
    <header className="mb-8 space-y-4 border-b pb-6">
      {showBack && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin">Voltar ao painel</Link>
        </Button>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
