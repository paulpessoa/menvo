"use client"

import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { useRouter } from "@/i18n/routing"

interface AISearchButtonProps {
  query: string
  loading: boolean
  onSearch: () => void
}

/**
 * Botão de busca com IA que atua sobre o mesmo campo de texto da busca
 * padrão. Ao contrário da digitação (debounce automático), essa busca só
 * dispara neste clique explícito: é uma chamada de LLM com custo e latência
 * bem maiores que o filtro no banco, então nunca deve rodar sozinha a cada
 * tecla.
 *
 * O botão sempre tem a mesma aparência (não vira um botão diferente pra
 * quem não está logado) — a exigência de login é comunicada num toast com
 * um atalho pra ir ao /login, em vez de navegar pra lá sem avisar por quê.
 */
export function AISearchButton({ query, loading, onSearch }: AISearchButtonProps) {
  const t = useTranslations("mentorsPage.magicSearch")
  const tCommon = useTranslations("common")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error(t("loginRequired"), {
        action: {
          label: tCommon("login"),
          onClick: () => router.push("/login")
        }
      })
      return
    }
    if (query.trim().length < 5) {
      toast.error(t("minChars"))
      return
    }
    onSearch()
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading || authLoading}
      aria-label={t("button")}
      className="h-11 sm:h-12 rounded-xl px-3 sm:px-5 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shrink-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{t("button")}</span>
    </Button>
  )
}
