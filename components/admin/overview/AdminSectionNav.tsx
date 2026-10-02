import { Link } from "@/i18n/routing"

interface AdminSection {
  title: string
  description: string
  href: string
}

/** Grouped by what the admin is doing: day-to-day operation, analysis, or system settings. */
const GROUPS: { title: string; sections: AdminSection[] }[] = [
  {
    title: "Operação",
    sections: [
      { title: "Verificação de mentores", description: "Fila de candidaturas com rascunho de resposta", href: "/dashboard/admin/verifications" },
      { title: "Usuários", description: "Busca, edição, papéis e convites", href: "/dashboard/admin/users" },
      { title: "Sessões de mentoria", description: "Pedidos, reenvio de e-mails e cancelamento", href: "/dashboard/admin/appointments" },
      { title: "Feedbacks", description: "Moderação de avaliações e voz da comunidade", href: "/dashboard/admin/feedbacks" },
      { title: "Organizações", description: "Parceiras ativas e organizações interessadas", href: "/dashboard/admin/organizations" }
    ]
  },
  {
    title: "Análise",
    sections: [
      { title: "Relatórios", description: "Crescimento da base por período e exportação", href: "/dashboard/admin/reports" },
      { title: "Custos de IA", description: "Custo por funcionalidade, modelo e usuário", href: "/dashboard/admin/ai-usage" }
    ]
  },
  {
    title: "Sistema",
    sections: [
      { title: "Retenção LGPD", description: "Fila de exclusão de contas e isenções", href: "/dashboard/admin/retention" },
      { title: "E-mails transacionais", description: "Prévia dos templates e envio de teste", href: "/dashboard/admin/emails" },
      { title: "Feature flags", description: "Ligar e desligar funcionalidades", href: "/dashboard/admin/feature-flags" }
    ]
  }
]

/** Text-only index of every admin page, replacing the old grid of icon cards. */
export function AdminSectionNav() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Áreas administrativas</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {GROUPS.map(group => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
            <ul className="divide-y rounded-lg border bg-card">
              {group.sections.map(section => (
                <li key={section.href}>
                  <Link href={section.href} className="block px-4 py-3 transition-colors hover:bg-muted/50">
                    <span className="block text-sm font-medium">{section.title}</span>
                    <span className="block text-xs text-muted-foreground">{section.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
