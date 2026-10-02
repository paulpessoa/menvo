"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Search, Users, Loader2, Info, MessageCircle, Sparkles, X, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MenteeCard } from "@/components/MenteeCard"
import { AIMatchButton } from "@/components/ai-match/AIMatchButton"
import { useAuth } from "@/lib/auth"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useRouter } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { createClient } from "@/lib/utils/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { ChatInterface } from "@/components/ChatInterface"
import { useFeatureFlag } from "@/lib/feature-flags"
import { useAiQuota } from "@/hooks/useAiQuota"
import { useOnboarding } from "@/hooks/useOnboarding"
import {
  communityService,
  type CommunityProfile,
} from "@/lib/services/community/community.service"
import { mentorService } from "@/lib/services/mentors/mentors.service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ArrowDownUp } from "lucide-react"

interface FilterState {
  sortBy: "newest" | "oldest" | "name" | "name-desc"
}

const initialFilters: FilterState = {
  sortBy: "newest"
}

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
  const [totalCount, setTotalCount] = useState(0)

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

  const [filters, setFilters] = useState<FilterState>(initialFilters)


  // Tracking query ID to safely discard out-of-order responses and avoid race conditions
  const queryIdRef = useRef(0)

  const loadProfiles = useCallback(async (
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
      const queryParams = new URLSearchParams({
        search,
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      queryParams.append("sortBy", filters.sortBy)
      
      const response = await fetch(`/api/community?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to load community profiles")
      }
      
      const result = await response.json()

      // If a newer query was initiated while this one was in flight, discard this result
      if (currentQueryId !== queryIdRef.current) return

      if (isInitial) {
        setProfiles(result.profiles)
      } else {
        setProfiles((prev) => [...prev, ...result.profiles])
      }

      setHasMore(result.hasMore)
      setTotalCount(result.totalCount || 0)
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
  }, [filters.sortBy, tCommunity])

  // Initial load on mount and debounced search updates
  useEffect(() => {
    const delay = searchTerm ? 300 : 0
    const timer = setTimeout(() => {
      loadProfiles(true, searchTerm, 0)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchTerm, filters])

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    loadProfiles(false, searchTerm, page + 1)
  }, [loadingMore, hasMore, page, searchTerm, loadProfiles])

  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore()
        }
      },
      { threshold: 1.0 }
    )

    const currentRef = loaderRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loadingMore, handleLoadMore])

  const handleChat = (targetUserId: string) => {
    if (!user) {
      toast.info(tCommon("loginRequired"))
      router.push("/login")
      return
    }

    const targetProfile = profiles.find((p) => p.id === targetUserId)
    if (!targetProfile) return

    // Chat desligado: o mentor vai ao perfil completo, lê o contexto e usa os
    // canais que o mentorado deixou visíveis (hoje, o LinkedIn)
    if (!isChatEnabled) {
      if (targetProfile.slug) {
        router.push(`/mentee/${targetProfile.slug}`)
      } else if (targetProfile.linkedin_url) {
        window.open(targetProfile.linkedin_url, "_blank", "noopener,noreferrer")
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
    <RequireRole roles={["mentor", "admin"]} fallback={<RestrictedAccessFallback />}>
      <div className="container mx-auto px-4 py-12">
        {/* Header - Cute Phrase */}
        <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
          Seu hobby, sua vivência, sua história — alguém está buscando exatamente isso.
        </p>

      {/* Search and Filter Bar */}
      <div id="tour-community-list" className="mb-2 sm:mb-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search + AI Match */}
          <div className="flex-1 flex gap-2 min-w-0">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <Input
                placeholder={tCommunity("searchPlaceholder")}
                className={`pl-10 h-11 sm:h-12 rounded-xl bg-card border border-border/80 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 text-sm sm:text-base ${
                  searchTerm ? "pr-10" : ""
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div id="tour-community-ai">
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
                compact
              />
            </div>
          </div>

          {/* Sort & Filters Action Row */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
            <Select
              value={filters.sortBy}
              onValueChange={(val: any) =>
                setFilters((prev) => ({ ...prev, sortBy: val }))
              }
            >
              <SelectTrigger className="w-full sm:w-[155px] h-11 sm:h-12 rounded-xl bg-card border border-border/80 shadow-2xs font-medium text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Ordenar por" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="name">A-Z</SelectItem>
                <SelectItem value="name-desc">Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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

      {/* Results Header */}
      {(searchTerm.trim() !== "" || displayedAIProfiles.length > 0) && (
        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-xs font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            {displayedAIProfiles.length > 0
              ? `${profiles.length} RESULTADOS COM IA`
              : `${totalCount} MEMBROS ENCONTRADOS`}
          </h2>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
            <div ref={loaderRef} className="mt-12 flex justify-center p-4">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {tCommon("loading")}
                </div>
              )}
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
      <CommunityTour />
      </div>
    </RequireRole>
  )
}

function CommunityTour() {
  const steps = [
    { popover: { title: "🤝 Comunidade da Menvo", description: "Bem-vindo à área exclusiva para mentores! Aqui você tem acesso ao diretório completo de pessoas buscando mentoria." } },
    { element: "#tour-community-ai", popover: { title: "Matching Inteligente", description: "Use a IA da Menvo para cruzar suas skills com as necessidades dos mentorados e encontrar pessoas que você pode ajudar agora mesmo." } },
    { element: "#tour-community-list", popover: { title: "Busca e Filtros", description: "Encontre perfis específicos usando a barra de pesquisa ou navegue pelos recém-chegados na plataforma." } },
    { popover: { title: "Seja proativo!", description: "Muitos talentos têm receio de pedir mentoria. Fique à vontade para puxar conversa e oferecer ajuda." } }
  ]

  useOnboarding("ob_community_1", steps)

  return null
}

function RestrictedAccessFallback() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-primary/10 p-5 rounded-full mb-6">
        <Lock className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-foreground">
        Área Exclusiva
      </h1>
      <p className="text-muted-foreground text-base max-w-[500px] mb-8 leading-relaxed">
        A <strong>Comunidade</strong> é um espaço seguro e exclusivo para os mentores da plataforma conhecerem mentorados e colaborarem entre si. 
        <br/><br/>
        Se você deseja ter acesso a esta funcionalidade e ajudar outras pessoas, torne-se um mentor ativando seu perfil!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button variant="outline" size="lg" onClick={() => router.back()} className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button size="lg" onClick={() => router.push('/profile?tab=mentorship')} className="w-full sm:w-auto shadow-md">
          Quero ser Mentor
        </Button>
      </div>
    </div>
  )
}
