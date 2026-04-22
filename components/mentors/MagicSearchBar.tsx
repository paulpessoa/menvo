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
    <div className="w-full max-w-4xl mx-auto mb-10">
      <form onSubmit={handleMagicSearch} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <Card className="relative bg-white border-2 border-primary/10 shadow-xl overflow-hidden rounded-2xl">
          <CardContent className="p-2 flex items-center gap-2">
            <div className="pl-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              className="border-0 focus-visible:ring-0 text-lg py-6 shadow-none flex-1 placeholder:text-muted-foreground/60"
              disabled={loading || !isAuthenticated}
            />
            
            {query && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={handleClear}
                className="hover:bg-transparent text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            )}

            {!authLoading && !isAuthenticated ? (
              <Button 
                asChild
                className="bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl px-6 h-12 text-sm font-medium transition-all"
              >
                <Link href="/login" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("loginLink")}</span>
                </Link>
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={loading || !query.trim() || authLoading}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>{t("button")}</span>
                  </div>
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
            className="text-center text-xs text-amber-600 font-medium mt-3 flex items-center justify-center gap-1"
          >
            <Lock className="h-3 w-3" /> 
            {t("loginRequired")}
          </motion.p>
        )}

        {isAuthenticated && !hasResult && !loading && (
           <motion.p 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1"
           >
             <Info className="h-3 w-3" /> 
             {t("disclaimer")}
           </motion.p>
        )}
        
        {loading && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-primary font-medium mt-3 animate-pulse"
          >
            {t("loading")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
