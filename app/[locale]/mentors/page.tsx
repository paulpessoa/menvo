"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import Link from "next/link"
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Heart,
  Loader2,
  ArrowDownUp,
  Globe,
  SearchX,
  Sparkles,
  X
} from "lucide-react"

import { useAuth } from "@/lib/auth"
import { MentorCard } from "@/components/mentors/MentorCard"
import { MentorSkeletonCard } from "@/components/mentors/MentorSkeletonCard"
import { MagicSearchBar } from "@/components/mentors/MagicSearchBar"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { mentorService } from "@/lib/services/mentors/mentors.service"
import { useDebounce } from "@/hooks/useDebounce"

interface MentorProfile {
  id: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  city: string | null
  state: string | null
  country: string | null
  languages: string[] | null
  mentorship_topics: string[] | null
  inclusive_tags: string[] | null
  expertise_areas: string[] | null
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
  experience_years: number | null
  slug: string | null
  created_at?: string | null
}

interface FilterState {
  search: string
  country: string
  state: string
  city: string
  languages: string[]
  topics: string[]
  inclusiveTags: string[]
  priceRange: [number, number]
  availabilityStatus: string
  experienceYears: string
  sortBy: "relevance" | "experience" | "newest" | "name"
}

const initialFilters: FilterState = {
  search: "",
  country: "all",
  state: "all",
  city: "",
  languages: [],
  topics: [],
  inclusiveTags: [],
  priceRange: [0, 500],
  availabilityStatus: "all",
  experienceYears: "all",
  sortBy: "relevance"
}

const ITEMS_PER_PAGE = 12

export default function MentorsPage() {
  const t = useTranslations("mentorsPage")
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [suggestedMentors, setSuggestedMentors] = useState<
    Record<string, string>
  >({})
  const [aiJustification, setAiJustification] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [availableFilters, setAvailableFilters] = useState({
    countries: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    languages: [] as string[],
    topics: [] as string[],
    inclusiveTags: [] as string[]
  })

  const { user } = useAuth()

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const debouncedSearch = useDebounce(filters.search, 350)
  const latestRequestIdRef = useRef(0)

  const fetchMentors = useCallback(async (isInitial = false, overridePage?: number) => {
    const currentRequestId = ++latestRequestIdRef.current
    try {
      const currentPage = isInitial ? 0 : (overridePage ?? page)
      if (isInitial) {
        setLoading(true)
        setPage(0)
      } else {
        setLoadingMore(true)
      }

      const { data, count } = await mentorService.searchCatalog({
        filters: {
          search: debouncedSearch,
          country: filters.country,
          state: filters.state,
          city: filters.city,
          languages: filters.languages,
          topics: filters.topics,
          inclusiveTags: filters.inclusiveTags,
          availabilityStatus: filters.availabilityStatus,
          experienceYears: filters.experienceYears,
          sortBy: filters.sortBy
        },
        page: currentPage,
        limit: ITEMS_PER_PAGE
      })

      // Ignore stale responses from earlier requests
      if (currentRequestId !== latestRequestIdRef.current) {
        return
      }

      if (isInitial) {
        setMentors((data as unknown as MentorProfile[]) || [])
      } else {
        setMentors((prev) => [...prev, ...((data as unknown as MentorProfile[]) || [])])
      }

      const from = currentPage * ITEMS_PER_PAGE
      setTotalCount(count || 0)
      setHasMore((count || 0) > from + (data?.length || 0))
    } catch (error) {
      if (currentRequestId === latestRequestIdRef.current) {
        console.error("Error fetching mentors:", error)
        toast.error(t("errorLoadingMentors"))
      }
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [
    debouncedSearch,
    filters.country,
    filters.state,
    filters.city,
    filters.languages,
    filters.topics,
    filters.inclusiveTags,
    filters.availabilityStatus,
    filters.experienceYears,
    filters.sortBy,
    page,
    t
  ])

  const fetchFilterOptions = async () => {
    try {
      const options = await mentorService.getCatalogFilterOptions()
      setAvailableFilters(options)
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchMentors(true)
  }, [
    debouncedSearch,
    filters.country,
    filters.state,
    filters.city,
    filters.languages,
    filters.topics,
    filters.inclusiveTags,
    filters.availabilityStatus,
    filters.experienceYears,
    filters.sortBy
  ])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.country !== "all") count++
    if (filters.state !== "all") count++
    if (filters.city) count++
    if (filters.languages.length > 0) count++
    if (filters.topics.length > 0) count++
    if (filters.inclusiveTags.length > 0) count++
    if (filters.availabilityStatus !== "all") count++
    if (filters.experienceYears !== "all") count++
    return count
  }, [filters])

  const activeFacetCount = useMemo(() => {
    let count = 0
    if (filters.country !== "all") count++
    if (filters.state !== "all") count++
    if (filters.city) count++
    if (filters.languages.length > 0) count += filters.languages.length
    if (filters.topics.length > 0) count += filters.topics.length
    if (filters.inclusiveTags.length > 0) count += filters.inclusiveTags.length
    if (filters.availabilityStatus !== "all") count++
    if (filters.experienceYears !== "all") count++
    return count
  }, [filters])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchMentors(false, nextPage)
  }

  const handleAIMatch = (
    suggestions: Array<{ mentor_id: string; reason: string }>,
    justification: string
  ) => {
    const suggestionsMap: Record<string, string> = {}
    suggestions.forEach((s) => {
      suggestionsMap[s.mentor_id] = s.reason
    })
    setSuggestedMentors(suggestionsMap)
    setAiJustification(justification)

    setTimeout(() => {
      window.scrollTo({ top: 400, behavior: "smooth" })
    }, 100)
  }

  const handleClearAI = () => {
    setSuggestedMentors({})
    setAiJustification(null)
  }

  // Timezone calculations
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const brtTime = currentTime.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit"
  })
  const localTime = currentTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })
  const brtGmt = "GMT-3"
  const localGmt = (date: Date) => {
    const offset = -date.getTimezoneOffset() / 60
    return `GMT${offset >= 0 ? "+" : ""}${offset}:00`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Magic AI Search Bar */}
      <MagicSearchBar onMatch={handleAIMatch} onClear={handleClearAI} />

      {/* Search and Filter Bar */}
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className={`pl-10 h-11 sm:h-12 rounded-xl bg-card border border-border/80 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 text-sm sm:text-base ${
                filters.search ? "pr-10" : ""
              }`}
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort & Filters Action Row (balanced 50-50 on mobile, compact on desktop) */}
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
                  <SelectValue placeholder={t("sortBy.label")} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="relevance">{t("sortBy.relevance")}</SelectItem>
                <SelectItem value="experience">
                  {t("sortBy.experience")}
                </SelectItem>
                <SelectItem value="newest">{t("sortBy.newest")}</SelectItem>
                <SelectItem value="name">{t("sortBy.name")}</SelectItem>
              </SelectContent>
            </Select>

            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-11 sm:h-12 rounded-xl border border-border/80 shadow-2xs px-3 sm:px-5 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-card hover:bg-accent/40"
                >
                  <Filter className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t("filters")}</span>
                  {activeFacetCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 px-1.5 rounded-full text-[10px] flex items-center justify-center bg-primary text-primary-foreground">
                      {activeFacetCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l border-border/60">
                {/* Fixed Sheet Header */}
                <SheetHeader className="p-5 pb-4 border-b border-border/60 shrink-0 text-left">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-lg font-bold flex items-center gap-2">
                      <Filter className="h-4 w-4 text-primary" />
                      {t("sheetTitle")}
                    </SheetTitle>
                    {activeFacetCount > 0 && (
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {activeFacetCount} {activeFacetCount === 1 ? "filtro ativo" : "filtros ativos"}
                      </Badge>
                    )}
                  </div>
                  <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
                    {t("sheetDescription")}
                  </SheetDescription>
                </SheetHeader>

                {/* Scrollable Sheet Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Estado */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {t("state")}
                    </h3>
                    <Select
                      value={filters.state}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, state: value }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder={t("statePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allStates")}</SelectItem>
                        {availableFilters.states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cidade */}
                  {availableFilters.cities.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        {t("city")}
                      </h3>
                      <Select
                        value={filters.city || "all"}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            city: value === "all" ? "" : value
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder={t("cityPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allCities")}</SelectItem>
                          {availableFilters.cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Temas de Mentoria */}
                  <div className="space-y-2.5">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {t("topics")}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {availableFilters.topics.map((topic) => {
                        const isSelected = filters.topics.includes(topic)
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                topics: isSelected
                                  ? prev.topics.filter((t) => t !== topic)
                                  : [...prev.topics, topic]
                              }))
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-card hover:bg-muted text-muted-foreground border-border/80"
                            }`}
                          >
                            {topic}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tags Inclusivas */}
                  <div className="space-y-2.5">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                      <Heart className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {t("inclusiveTags")}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {availableFilters.inclusiveTags.map((tag) => {
                        const isSelected = filters.inclusiveTags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                inclusiveTags: isSelected
                                  ? prev.inclusiveTags.filter((t) => t !== tag)
                                  : [...prev.inclusiveTags, tag]
                              }))
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-card hover:bg-muted text-muted-foreground border-border/80"
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Disponibilidade */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {t("availability")}
                    </h3>
                    <Select
                      value={filters.availabilityStatus}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          availabilityStatus: value
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder={t("availabilityPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("anyStatus")}</SelectItem>
                        <SelectItem value="available">
                          {t("status.available")}
                        </SelectItem>
                        <SelectItem value="busy">{t("status.busy")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experiência */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {t("experience")}
                    </h3>
                    <Select
                      value={filters.experienceYears}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          experienceYears: value
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder={t("experiencePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("anyExperience")}</SelectItem>
                        <SelectItem value="0-2">0-2 anos</SelectItem>
                        <SelectItem value="3-5">3-5 anos</SelectItem>
                        <SelectItem value="6-10">6-10 anos</SelectItem>
                        <SelectItem value="11+">10+ anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sticky Sheet Footer */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/60 p-4 flex items-center gap-2.5 shrink-0 z-10">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl text-xs sm:text-sm font-semibold"
                    onClick={() => setFilters(initialFilters)}
                  >
                    {t("clearFilters")}
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md"
                    onClick={() => setIsFilterSheetOpen(false)}
                  >
                    Ver Mentores ({totalCount})
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filter Badges Bar */}
        {activeFacetCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs scrollbar-none">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
              Ativos:
            </span>
            {filters.state !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <span>Estado: {filters.state}</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-75" onClick={() => setFilters(p => ({ ...p, state: "all", city: "" }))} />
              </Badge>
            )}
            {filters.city && (
              <Badge variant="secondary" className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <span>Cidade: {filters.city}</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-75" onClick={() => setFilters(p => ({ ...p, city: "" }))} />
              </Badge>
            )}
            {filters.topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <span>{topic}</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-75" onClick={() => setFilters(p => ({ ...p, topics: p.topics.filter(t => t !== topic) }))} />
              </Badge>
            ))}
            {filters.inclusiveTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <span>{tag}</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-75" onClick={() => setFilters(p => ({ ...p, inclusiveTags: p.inclusiveTags.filter(t => t !== tag) }))} />
              </Badge>
            ))}
            {filters.availabilityStatus !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <span>{filters.availabilityStatus === "available" ? t("status.available") : t("status.busy")}</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-75" onClick={() => setFilters(p => ({ ...p, availabilityStatus: "all" }))} />
              </Badge>
            )}
            {filters.experienceYears !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-lg px-2.5 py-1 text-xs shrink-0 bg-primary/10 text-primary border border-primary/20">
                <span>{filters.experienceYears} anos</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-75" onClick={() => setFilters(p => ({ ...p, experienceYears: "all" }))} />
              </Badge>
            )}
            <button
              type="button"
              onClick={() => setFilters(initialFilters)}
              className="text-[11px] font-semibold text-primary hover:underline shrink-0 ml-1.5 cursor-pointer"
            >
              {t("clearFilters")}
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center px-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {t("resultsFound", { count: totalCount })}
        </p>
      </div>

      {/* Mentors Grid or Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MentorSkeletonCard key={i} />
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="relative text-center py-16 px-6 sm:px-12 bg-gradient-to-b from-primary/5 via-background to-muted/20 rounded-[2.5rem] border border-border/80 shadow-sm max-w-3xl mx-auto my-8 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
          
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm">
            <SearchX className="h-8 w-8" />
          </div>

          <h3 className="text-2xl font-black tracking-tight text-gray-900 mb-2">
            {t("noMentorsTitle")}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            {t("noMentorsDescription")}
          </p>

          {/* Sugestões de áreas populares */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {t("popularSuggestions")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
              {["Frontend", "Backend", "UX / UI", "Carreira", "Produto", "Data Science"].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...initialFilters, search: topic }))}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-white hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-2xs cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setFilters(initialFilters)}
              className="rounded-xl border-2 font-bold px-6 h-11 w-full sm:w-auto"
            >
              {t("clearFilters")}
            </Button>
            <Button
              asChild
              className="rounded-xl font-bold px-6 h-11 shadow-sm w-full sm:w-auto"
            >
              <Link href="/quiz">
                <Sparkles className="h-4 w-4 mr-2" />
                {t("takeQuizCTA")}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Primeiro os sugeridos pela IA */}
            {mentors
              .filter(
                (m) => m.id && Object.keys(suggestedMentors).includes(m.id)
              )
              .map((mentor) => (
                <MentorCard
                  key={`ai-${mentor.id}`}
                  mentor={mentor}
                  isAIHighlighted={true}
                  aiReason={mentor.id ? suggestedMentors[mentor.id] : undefined}
                />
              ))}

            {/* Depois os demais */}
            {mentors
              .filter(
                (m) => !m.id || !Object.keys(suggestedMentors).includes(m.id)
              )
              .map((mentor) => (
                <MentorCard key={mentor.id || "unknown"} mentor={mentor} />
              ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-12 text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl border-2 font-bold px-10"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("loadMore")
                )}
              </Button>
            </div>
          )}

          {/* Timezone Info Banner - Transparente e Preciso (Mover para o fim) */}
          <div className="mt-20 mb-10 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <p className="text-sm font-bold text-gray-900 leading-none">
                    {t("timezoneBanner.title")}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("timezoneBanner.description")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="flex-1 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/50 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                    {t("timezoneBanner.referenceLabel")} ({brtGmt})
                  </p>
                  <p className="text-lg font-bold text-gray-800 tabular-nums">
                    {brtTime}
                  </p>
                </div>
                <div className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-center shadow-lg shadow-primary/20">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">
                    {t("timezoneBanner.localLabel")} ({localGmt(currentTime)})
                  </p>
                  <p className="text-lg font-bold tabular-nums">{localTime}</p>
                  <p className="text-[9px] font-medium opacity-80 truncate max-w-[120px] mx-auto">
                    {userTimezone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
