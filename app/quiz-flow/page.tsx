import { readFile } from 'fs/promises'
import { join } from 'path'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Fluxograma do Quiz - MENVO',
  description: 'Documentação técnica do fluxo completo do sistema de quiz'
}

export default async function QuizFlowPage() {
  // Ler o arquivo markdown do fluxograma
  const filePath = join(process.cwd(), 'QUIZ-FLUXOGRAMA.md')
  const markdownContent = await readFile(filePath, 'utf-8')

  // Ler o código da Edge Function
  const edgeFunctionPath = join(process.cwd(), 'supabase/functions/analyze-quiz/index.ts')
  const edgeFunctionCode = await readFile(edgeFunctionPath, 'utf-8')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/quiz">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Quiz
            </Button>
          </Link>

          <a href="/QUIZ-FLUXOGRAMA.md" download>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Baixar Markdown
            </Button>
          </a>
        </div>

        {/* Content Card - Fluxograma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              Fluxograma do Sistema de Quiz
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Documentação técnica completa do fluxo de dados, camadas e integrações
            </p>
          </CardHeader>
          <CardContent>
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-slate-50 dark:bg-slate-900 p-6 rounded-lg overflow-x-auto border">
                {markdownContent}
              </pre>
            </article>
          </CardContent>
        </Card>

        {/* Content Card - Edge Function Code */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              Código da Edge Function: analyze-quiz
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Implementação completa da função que processa o quiz com IA
            </p>
          </CardHeader>
          <CardContent>
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-50 dark:bg-slate-900 p-6 rounded-lg overflow-x-auto border">
                <code className="language-typescript">{edgeFunctionCode}</code>
              </pre>
            </article>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/quiz">
            <Button size="lg">
              Fazer o Quiz
            </Button>
          </Link>
          <a href="https://excalidraw.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg">
              Abrir no Excalidraw
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
