"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Search, Users, Loader2, Info, MessageCircle, Sparkles, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MenteeCard } from "@/components/MenteeCard"
import { AIMatchButton } from "@/components/ai-match/AIMatchButton"
import { useAuth } from "@/lib/auth"
import { useRouter } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ChatInterface } from "@/components/ChatInterface"
import { useFeatureFlag } from "@/lib/feature-flags"
import { useAiQuota } from "@/hooks/useAiQuota"
import {
  communityService,
  CommunityProfile,
} from "@/lib/services/community/community.service"

const ITEMS_PER_PAGE = 12

export default function CommunityPage() {
  const tCommunity = useTranslations("community")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const [profiles, setProfiles] = useState<CommunityProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Chat Sidebar State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<CommunityProfile | null>(null)

  // AI Match State
  const [suggestedProfiles, setSuggestedProfiles] = useState<Record<string, string>>({})
  const [aiJustification, setAiJustification] = useState<string | null>(null)
  const [aiQuery, setAiQuery] = useState<string | null>(null)
  const [aiRecommendedProfiles, setAiRecommendedProfiles] = useState<CommunityProfile[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const { quota: aiQuota, setQuota: setAiQuota } = useAiQuota("match")

  const { user, isMentor: authIsMentor, cachedRoles } = useAuth()
  const router = useRouter()
  const isChatEnabled = useFeatureFlag("chat_flag")

  const isMentor =
    authIsMentor ||
    cachedRoles?.mentor ||
    cachedRoles?.roles?.includes("mentor") ||
    false

  // Tracking query ID to safely discard out-of-order responses and avoid race conditions
  const queryIdRef = useRef(0)

  const loadProfiles = async (
    isInitial: boolean,
    search: string,
    pageNum: number
  ) => {
    const currentQueryId = ++queryIdRef.current

    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const result = await communityService.getCommunityProfiles({
        search,
        page: pageNum,
        limit: ITEMS_PER_PAGE,
      })

      // If a newer query was initiated while this one was in flight, discard this result
      if (currentQueryId !== queryIdRef.current) return

      if (isInitial) {
        setProfiles(result.profiles)
      } else {
        setProfiles((prev) => [...prev, ...result.profiles])
      }

      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      if (currentQueryId === queryIdRef.current) {
        console.error("[CommunityPage] Error loading profiles:", error)
        toast.error(tCommunity("errorLoading"))
      }
    } finally {
      if (currentQueryId === queryIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  // Initial load on mount and debounced search updates
  useEffect(() => {
    const delay = searchTerm ? 300 : 0
    const timer = setTimeout(() => {
      loadProfiles(true, searchTerm, 0)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    loadProfiles(false, searchTerm, page + 1)
  }

  const handleChat = (targetUserId: string) => {
    if (!user) {
      toast.info(tCommon("loginRequired"))
      router.push("/login")
      return
    }

    const targetProfile = profiles.find((p) => p.id === targetUserId)
    if (!targetProfile) return

    // Chat desligado: a troca acontece no LinkedIn (ou no perfil, se não houver LinkedIn)
    if (!isChatEnabled) {
      if (targetProfile.linkedin_url) {
        window.open(targetProfile.linkedin_url, "_blank", "noopener,noreferrer")
      } else if (targetProfile.slug) {
        router.push(`/mentee/${targetProfile.slug}`)
      }
      return
    }

    setSelectedUser(targetProfile)
    setIsChatOpen(true)
  }

  const handleClearAI = () => {
    setSuggestedProfiles({})
    setAiJustification(null)
    setAiQuery(null)
    setAiRecommendedProfiles([])
  }

  const handleAIMatch = async (
    suggestions: Array<{ profile_id: string; reason: string }>,
    justification: string,
    searchQuery: string
  ) => {
    const suggestionsMap: Record<string, string> = {}
    const ids: string[] = []
    suggestions.forEach((s) => {
      suggestionsMap[s.profile_id] = s.reason
      ids.push(s.profile_id)
    })
    setSuggestedProfiles(suggestionsMap)
    setAiJustification(justification)
    setAiQuery(searchQuery)

    try {
      const recommended = await communityService.getProfilesByIds(ids)
      setAiRecommendedProfiles(recommended)
    } catch (err) {
      console.error("[CommunityPage] Erro ao carregar membros recomendados pela IA:", err)
    }

    setTimeout(() => window.scrollTo({ top: 350, behavior: "smooth" }), 100)
  }

  const handleAISearch = async (query: string) => {
    setAiLoading(true)
    try {
      const response = await fetch("/api/ai/match-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })
      const result = await response.json()
      setAiQuota(result.quota)

      if (response.status === 429) {
        const resetDate = result.quota?.resetsAt
          ? new Date(result.quota.resetsAt).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })
          : ""
        toast.error(
          result.quota?.reason === "budget"
            ? tCommunity("magicSearch.budgetExhausted", { date: resetDate })
            : tCommunity("magicSearch.quotaExhausted", { date: resetDate })
        )
        return
      }

      if (!response.ok) throw new Error(result.error || tCommunity("magicSearch.error"))

      if (result.no_match) {
        toast.info(tCommunity("magicSearch.noMatch"))
        handleClearAI()
      } else {
        await handleAIMatch(result.suggestions, result.global_justification, query)
        toast.success(tCommunity("magicSearch.success"))
      }
    } catch (error) {
      console.error("[CommunityPage] Magic Search Error:", error)
      toast.error(tCommunity("magicSearch.error"))
    } finally {
      setAiLoading(false)
    }
  }

  const displayedAIProfiles = useMemo(() => {
    if (!Object.keys(suggestedProfiles).length) return []
    const map = new Map<string, CommunityProfile>()
    aiRecommendedProfiles.forEach((p) => map.set(p.id, p))
    profiles.forEach((p) => {
      if (suggestedProfiles[p.id]) map.set(p.id, p)
    })
    return Array.from(map.values())
  }, [suggestedProfiles, aiRecommendedProfiles, profiles])

  const otherProfiles = useMemo(() => {
    const aiIds = new Set(displayedAIProfiles.map((p) => p.id))
    return profiles.filter((p) => !aiIds.has(p.id))
  }, [profiles, displayedAIProfiles])

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Mural de Mentorados
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Conheça pessoas que buscam aprender e ofereça sua mentoria de forma
            proativa.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 p-4 rounded-lg border border-primary/10 max-w-xs">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-primary/80 leading-snug">
            Dica: Mentores proativos que ajudam quem busca conhecimento ganham
            3x mais visibilidade.
          </p>
        </div>
      </div>

      {/* Search + AI Match */}
      <div className="flex flex-col sm:flex-row gap-2.5 max-w-2xl mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommunity("searchPlaceholder")}
            className="pl-10 h-11 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <AIMatchButton
          title={tCommunity("magicSearch.title")}
          description={tCommunity("magicSearch.disclaimer")}
          placeholder={tCommunity("magicSearch.placeholder")}
          loading={aiLoading}
          loginRequiredMessage={tCommunity("magicSearch.loginRequired")}
          minCharsMessage={tCommunity("magicSearch.minChars")}
          submitLabel={tCommunity("magicSearch.button")}
          buttonLabel={tCommunity("magicSearch.button")}
          quota={aiQuota}
          quotaHint={(q) =>
            q.reason === "budget"
              ? tCommunity("magicSearch.budgetExhausted", {
                  date: new Date(q.resetsAt).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })
                })
              : q.remaining! > 0
                ? tCommunity("magicSearch.quotaRemaining", { remaining: q.remaining!, limit: q.limit! })
                : tCommunity("magicSearch.quotaExhausted", {
                    date: new Date(q.resetsAt).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })
                  })
          }
          onSubmit={handleAISearch}
        />
      </div>

      {/* AI Recommendation Banner */}
      {aiJustification && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 p-5 sm:p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 max-w-4xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Recomendações da IA
                </Badge>
                {aiQuery && (
                  <span className="text-xs font-semibold text-muted-foreground truncate">
                    Para quem você quer ajudar: <strong className="text-foreground">"{aiQuery}"</strong>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed pt-1">{aiJustification}</p>
            </div>
            <Button
              onClick={handleClearAI}
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/30 hover:border-primary text-xs font-semibold shrink-0 h-9"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar busca com IA
            </Button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-muted animate-pulse border shadow-sm"
            />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-2xl border-2 border-dashed">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-semibold">{tCommunity("noResults")}</h3>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSearchTerm("")}
          >
            {tCommunity("clearSearch")}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAIProfiles.map((profile) => (
              <MenteeCard
                key={`ai-${profile.id}`}
                profile={profile}
                isMentor={isMentor}
                onChat={handleChat}
                isAIHighlighted
                aiReason={suggestedProfiles[profile.id]}
              />
            ))}
            {otherProfiles.map((profile) => (
              <MenteeCard
                key={profile.id}
                profile={profile}
                isMentor={isMentor}
                onChat={handleChat}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 shadow-sm"
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {tCommunity("loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Inline Chat Drawer */}
      {isChatEnabled && (
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col h-full border-l shadow-2xl">
          <SheetHeader className="p-4 border-b bg-white">
            <SheetDescription className="sr-only">
              Conversa com {selectedUser?.full_name || "membro"}
            </SheetDescription>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chat com {selectedUser?.full_name}
            </SheetTitle>
          </SheetHeader>

          {selectedUser && user && (
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                mentorId={selectedUser.id}
                currentUserId={user.id}
                mentorName={selectedUser.full_name || "Membro"}
                mentorAvatar={selectedUser.avatar_url || undefined}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
      )}
    </div>
  )
}
