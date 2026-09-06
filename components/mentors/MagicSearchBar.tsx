"use client"

import { useState } from "react"
import { Search, Sparkles, Loader2, X, Info, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { Link } from "@/i18n/routing"

interface MagicSearchBarProps {
  onMatch: (suggestions: Array<{mentor_id: string, reason: string}>, justification: string) => void
  onClear: () => void
}

export function MagicSearchBar({ onMatch, onClear }: MagicSearchBarProps) {
  const t = useTranslations("mentorsPage.magicSearch")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasResult, setHasResult] = useState(false)

  const handleMagicSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error(t("loginRequired"))
      return
    }

    if (query.trim().length < 5) {
      toast.error(t("minChars"))
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || t("error"))

      if (result.no_match) {
        toast.info(t("noMatch"))
        onClear()
        setHasResult(false)
      } else {
        onMatch(result.suggestions, result.global_justification)
        setHasResult(true)
        toast.success(t("success"))
      }
    } catch (error: any) {
      console.error("Magic Search Error:", error)
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery("")
    setHasResult(false)
    onClear()
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-10">
      <form onSubmit={handleMagicSearch} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <Card className="relative bg-card border-2 border-primary/15 shadow-xl overflow-hidden rounded-2xl">
          <CardContent className="p-3 sm:p-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2">
            {/* Input Row */}
            <div className="flex items-center gap-2 flex-1 w-full bg-muted/30 sm:bg-transparent rounded-xl px-2 sm:px-0">
              <div className="pl-1 sm:pl-3 shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                className="border-0 focus-visible:ring-0 text-sm sm:text-base py-2.5 sm:py-6 shadow-none flex-1 placeholder:text-muted-foreground/60 bg-transparent min-w-0"
                disabled={loading || !isAuthenticated}
              />
              
              {query && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClear}
                  className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground shrink-0"
                  aria-label="Limpar busca inteligente"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Action Button */}
            {!authLoading && !isAuthenticated ? (
              <Button 
                asChild
                className="w-full sm:w-auto bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl px-4 sm:px-6 h-11 sm:h-12 text-sm font-medium transition-all shrink-0"
              >
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>{t("loginLink")}</span>
                </Link>
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={loading || !query.trim() || authLoading}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 sm:px-8 h-11 sm:h-12 text-sm sm:text-base font-bold shadow-md sm:shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] shrink-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>{t("button")}</span>
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
      
      <AnimatePresence>
        {!isAuthenticated && !authLoading && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium mt-2.5 sm:mt-3 px-2 flex items-center justify-center gap-1.5 leading-relaxed"
          >
            <Lock className="h-3.5 w-3.5 shrink-0" /> 
            <span>{t("loginRequired")}</span>
          </motion.p>
        )}

        {isAuthenticated && !hasResult && !loading && (
           <motion.p 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center text-xs text-muted-foreground mt-2.5 sm:mt-3 px-2 flex items-center justify-center gap-1.5 leading-relaxed"
           >
             <Info className="h-3.5 w-3.5 shrink-0" /> 
             <span>{t("disclaimer")}</span>
           </motion.p>
        )}
        
        {loading && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-primary font-medium mt-2.5 sm:mt-3 px-2 flex items-center justify-center gap-1.5 animate-pulse"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{t("loading")}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
