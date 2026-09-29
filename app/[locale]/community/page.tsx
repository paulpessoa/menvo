"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Search, Users, Loader2, Info, MessageCircle, Sparkles, X } from "lucide-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowDownUp, Filter, Check } from "lucide-react"

interface FilterState {
  organization: string
  topics: string[]
  sortBy: "newest" | "oldest" | "name" | "name-desc"
}

const initialFilters: FilterState = {
  organization: "",
  topics: [],
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
  const [topicSearch, setTopicSearch] = useState("")

  const { user, isMentor: authIsMentor, cachedRoles } = useAuth()
  const router = useRouter()
  const isChatEnabled = useFeatureFlag("chat_flag")

  const isMentor =
    authIsMentor ||
    cachedRoles?.mentor ||
    cachedRoles?.roles?.includes("mentor") ||
    false

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [availableFilters, setAvailableFilters] = useState({
    countries: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    topics: [] as string[]
  })

  useEffect(() => {
    mentorService.getCatalogFilterOptions().then((opts) => setAvailableFilters({
      countries: opts.countries,
      states: opts.states,
      cities: opts.cities,
      topics: opts.topics
    })).catch(console.error)
  }, [])

  const activeFacetCount = useMemo(() => {
    let count = 0
    if (filters.organization) count++
    if (filters.topics.length > 0) count += filters.topics.length
    return count
  }, [filters])

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
      const queryParams = new URLSearchParams({
        search,
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      if (filters.organization) queryParams.append("organization", filters.organization)
      filters.topics.forEach(t => queryParams.append("topics[]", t))
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
  }, [searchTerm, filters])

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
    <RequireRole roles={["mentor", "admin"]}>
      <div className="container mx-auto px-4 py-12">
        {/* Header - Cute Phrase */}
        <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
          Seu hobby, sua vivência, sua história — alguém está buscando exatamente isso.
        </p>

      {/* Search + Filters (Single Row) */}
      <div className="flex flex-col xl:flex-row gap-3 w-full mb-8">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommunity("searchPlaceholder")}
            className="pl-10 h-11 rounded-xl w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
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

          <Select
            value={filters.sortBy}
            onValueChange={(val: any) =>
              setFilters((prev) => ({ ...prev, sortBy: val }))
            }
          >
            <SelectTrigger className="w-full sm:w-[155px] h-11 rounded-xl bg-card border border-border/80 shadow-2xs font-medium text-xs sm:text-sm">
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

          <Input
            placeholder="Organização..."
            value={filters.organization}
            onChange={(e) => setFilters(p => ({ ...p, organization: e.target.value }))}
            className="w-full sm:w-[160px] h-11 rounded-xl bg-card border-border/80 text-sm placeholder:text-muted-foreground/70 shadow-2xs"
            list="organizations-list"
          />
          <datalist id="organizations-list">
            <option value="Sebrae" />
            <option value="Prouni" />
            <option value="Hackathon" />
            <option value="ONG" />
          </datalist>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[180px] h-11 rounded-xl bg-card border-border/80 shadow-2xs font-medium text-xs sm:text-sm flex items-center justify-start gap-1.5 px-3"
              >
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {filters.topics.length === 0 
                    ? "Tópicos" 
                    : `${filters.topics.length} selecionado(s)`}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-2 rounded-xl" align="end">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Buscar tópico..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="h-8 text-sm rounded-lg"
                />
                <div className="max-h-[200px] overflow-y-auto pr-1 flex flex-col gap-1.5 mt-1">
                  {availableFilters.topics
                    .filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()))
                    .map((topic) => {
                      const isChecked = filters.topics.includes(topic)
                      return (
                        <label
                          key={topic}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                ...prev,
                                topics: checked 
                                  ? [...prev.topics, topic]
                                  : prev.topics.filter(t => t !== topic)
                              }))
                            }}
                          />
                          <span className="text-sm leading-none truncate flex-1">{topic}</span>
                        </label>
                      )
                    })}
                  {availableFilters.topics.length > 0 && availableFilters.topics.filter(t => t.toLowerCase().includes(topicSearch.toLowerCase())).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum tópico encontrado.</p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Active Filter Badges */}
      {activeFacetCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-8 text-xs scrollbar-none">
          <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
            Ativos:
          </span>
          {filters.organization && (
            <Badge
              variant="secondary"
              onClick={() => setFilters(p => ({ ...p, organization: "" }))}
              className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-colors"
            >
              <span>Org: {filters.organization}</span>
              <X className="h-3 w-3 opacity-70 hover:opacity-100" />
            </Badge>
          )}

          {filters.topics.map((topic) => (
            <Badge
              key={topic}
              variant="secondary"
              onClick={() => setFilters(p => ({ ...p, topics: p.topics.filter(t => t !== topic) }))}
              className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-colors"
            >
              <span>{topic}</span>
              <X className="h-3 w-3 opacity-70 hover:opacity-100" />
            </Badge>
          ))}
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="text-[11px] font-semibold text-primary hover:underline shrink-0 ml-1.5 cursor-pointer"
          >
            Limpar tudo
          </button>
        </div>
      )}

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
                  <Loader2 className="mr-2 animate-spin h-4 w-4" />
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
    </RequireRole>
  )
}
