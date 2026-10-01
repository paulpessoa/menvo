import { notFound } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import fs from "fs"
import path from "path"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const article = getArticle(resolvedParams.slug)
  if (!article) return { title: "Artigo não encontrado | Menvo" }

  return {
    title: `${article.title} | Central de Ajuda Menvo`,
    description: article.summary,
  }
}

function getKbArticles() {
  const kbPath = path.join(process.cwd(), "kb", "_index.json")
  if (!fs.existsSync(kbPath)) return []
  const content = fs.readFileSync(kbPath, "utf-8")
  return JSON.parse(content) as any[]
}

function getArticle(slug: string) {
  const articles = getKbArticles()
  return articles.find(a => a.id === slug)
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const article = getArticle(resolvedParams.slug)

  if (!article) {
    notFound()
  }

  return (
    <PageContainer size="3xl" className="py-12">
      <div className="mb-8">
        <Link 
          href="/ajuda" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Central de Ajuda
        </Link>
      </div>

      <article className="bg-card text-card-foreground border rounded-xl p-8 shadow-sm">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-a:text-primary hover:prose-a:text-primary/80 prose-headings:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {article.links && article.links.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Links Úteis</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {article.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url}
                  className="inline-flex items-center justify-center px-4 py-2 border rounded-md bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                >
                  {link.label}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </PageContainer>
  )
}
