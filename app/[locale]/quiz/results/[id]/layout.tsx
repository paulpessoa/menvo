import type { Metadata } from "next"
import { getQuizResultPreview } from "@/lib/services/quiz/quiz-result.server"

const DEFAULT_TITLE = "Meu diagnóstico de carreira"
const DESCRIPTION =
  "Plano de ação e mentores indicados a partir de um diagnóstico gratuito no MENVO. Faça o seu em 3 minutos."

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  const { id } = await params
  const preview = await getQuizResultPreview(id)
  const headline = preview && !preview.needsRetake ? preview.title : DEFAULT_TITLE
  const title = `${headline} | MENVO`

  return {
    title,
    description: DESCRIPTION,
    // Personal result: shareable by link, but kept out of search engines.
    robots: { index: false, follow: false },
    openGraph: {
      type: "article",
      title,
      description: DESCRIPTION,
      siteName: "MENVO",
      locale: "pt_BR"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: DESCRIPTION
    }
  }
}

export default function QuizResultsLayout({ children }: { children: React.ReactNode }) {
  return children
}
