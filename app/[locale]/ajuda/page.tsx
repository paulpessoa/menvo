import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Book, LifeBuoy, Users, Building, ShieldCheck, ChevronRight, FileText } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import fs from "fs"
import path from "path"

export const metadata = {
  title: "Central de Ajuda | Menvo",
  description: "Tire suas dúvidas e aprenda a usar a plataforma Menvo.",
}

// Lendo direto do _index.json que é gerado no build da KB
function getKbArticles() {
  const kbPath = path.join(process.cwd(), "kb", "_index.json")
  if (!fs.existsSync(kbPath)) return []
  const content = fs.readFileSync(kbPath, "utf-8")
  return JSON.parse(content) as any[]
}

const CATEGORY_ICONS: Record<string, any> = {
  comecando: Book,
  faq: LifeBuoy,
  mentorados: Users,
  mentores: FileText,
  organizacoes: Building,
  politicas: ShieldCheck,
}

const CATEGORY_LABELS: Record<string, string> = {
  comecando: "Começando na Menvo",
  faq: "Perguntas Frequentes",
  mentorados: "Para Mentorados",
  mentores: "Para Mentores",
  organizacoes: "Organizações Parceiras",
  politicas: "Políticas e Diretrizes",
}

export default async function HelpCenterPage() {
  const articles = getKbArticles()

  // Agrupa artigos por categoria
  const groupedArticles = articles.reduce((acc, article) => {
    const cat = article.category || "outros"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(article)
    return acc
  }, {} as Record<string, any[]>)

  const categories = Object.keys(CATEGORY_LABELS).filter(cat => groupedArticles[cat]?.length > 0)

  return (
    <PageContainer size="4xl" className="py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">
          Como podemos te ajudar?
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Navegue pelos nossos guias, tutoriais e perguntas frequentes para aproveitar ao máximo a Menvo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((categoryId) => {
          const categoryArticles = groupedArticles[categoryId]
          const Icon = CATEGORY_ICONS[categoryId] || Book
          const title = CATEGORY_LABELS[categoryId]

          return (
            <div key={categoryId} className="flex flex-col border rounded-xl p-6 bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <ul className="flex-1 flex flex-col gap-3">
                {categoryArticles.map((article: any) => (
                  <li key={article.id}>
                    <Link
                      href={`/ajuda/${article.id}`}
                      className="group flex items-start gap-2 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}
