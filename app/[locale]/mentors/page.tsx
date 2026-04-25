"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Heart,
  Loader2
} from "lucide-react"

import { useAuth } from "@/lib/auth"
import { MentorCard } from "@/components/mentors/MentorCard"
import { MentorSkeletonCard } from "@/components/mentors/MentorSkeletonCard"
import { MagicSearchBar } from "@/components/mentors/MagicSearchBar"
import { useFavorites } from "@/hooks/useFavorites"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/utils/supabase/client"

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
  experienceYears: "all"
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

  const [suggestedMentors, setSuggestedMentors] = useState<
    Record<string, string>
  >({})
  const [aiJustification, setAiJustification] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [availableFilters, setAvailableFilters] = useState({
    countries: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    languages: [] as string[],
    topics: [] as string[],
    inclusiveTags: [] as string[]
  })

  const supabase = createClient()
  const { user } = useAuth()
  const { favorites, toggleFavorite } = useFavorites(user?.id)

  const fetchMentors = async (isInitial = false) => {
    try {
      const currentPage = isInitial ? 0 : page
      if (isInitial) {
        setLoading(true)
        setPage(0)
      } else {
        setLoadingMore(true)
      }

      let query = supabase.from("mentors_view").select(
        `
          id,
          full_name,
          avatar_url,
          bio,
          job_title,
          company,
          city,
          state,
          country,
          languages,
          mentorship_topics,
          inclusion_tags,
          inclusive_tags,
          expertise_areas,
          availability_status,
          average_rating,
          total_reviews,
          total_sessions,
          experience_years,
          slug
        `,
        { count: "exact" }
      )

      // Apply Filters
      if (filters.search && filters.search.trim() !== "") {
        const searchTerm = `%${filters.search.trim()}%`
        query = query.or(
          `full_name.ilike.${searchTerm},job_title.ilike.${searchTerm},company.ilike.${searchTerm},bio.ilike.${searchTerm}`
        )
      }

      if (filters.country && filters.country !== "all") {
        query = query.eq("country", filters.country)
      }

      if (filters.state && filters.state !== "all") {
        query = query.eq("state", filters.state)
      }

      if (filters.city && filters.city.trim() !== "") {
        query = query.ilike("city", `%${filters.city.trim()}%`)
      }

      if (filters.languages.length > 0) {
        query = query.contains("languages", filters.languages)
      }

      if (filters.topics.length > 0) {
        query = query.contains("mentorship_topics", filters.topics)
      }

      if (filters.inclusiveTags.length > 0) {
        query = query.contains("inclusion_tags", filters.inclusiveTags)
      }

      if (filters.availabilityStatus !== "all") {
        query = query.eq("availability_status", filters.availabilityStatus)
      }

      if (filters.experienceYears !== "all") {
        const parts = filters.experienceYears.split("-")
        const min = parseInt(parts[0])
        const max = parts[1] ? parseInt(parts[1]) : null

        if (!isNaN(min)) {
          query = query.gte("experience_years", min)
        }
        if (max && !isNaN(max)) {
          query = query.lte("experience_years", max)
        }
      }

      // Pagination
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      query = query
        .order("average_rating", { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      if (isInitial) {
        setMentors(data || [])
      } else {
        setMentors((prev) => [...prev, ...(data || [])])
      }

      setTotalCount(count || 0)
      setHasMore((count || 0) > from + (data?.length || 0))
    } catch (error) {
      console.error("Error fetching mentors:", error)
      toast.error(t("errorLoadingMentors"))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("mentors_view")
        .select(
          "country, state, city, languages, mentorship_topics, inclusion_tags"
        )

      if (error) throw error

      const countries = new Set<string>()
      const states = new Set<string>()
      const cities = new Set<string>()
      const languages = new Set<string>()
      const topics = new Set<string>()
      const inclusiveTags = new Set<string>()

      ;(data as any[])?.forEach((mentor) => {
        if (mentor.country) countries.add(mentor.country)
        if (mentor.state) states.add(mentor.state)
        if (mentor.city) cities.add(mentor.city)
        mentor.languages?.forEach((l: string) => languages.add(l))
        mentor.mentorship_topics?.forEach((t: string) => topics.add(t))
        mentor.inclusion_tags?.forEach((t: string) => inclusiveTags.add(t))
      })

      setAvailableFilters({
        countries: Array.from(countries).sort(),
        states: Array.from(states).sort(),
        cities: Array.from(cities).sort(),
        languages: Array.from(languages).sort(),
        topics: Array.from(topics).sort(),
        inclusiveTags: Array.from(inclusiveTags).sort()
      })
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchMentors(true)
  }, [filters])

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

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
    fetchMentors(false)
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
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="pl-10"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              {t("filters")}
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("sheetTitle")}</SheetTitle>
              <SheetDescription>{t("sheetDescription")}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 pb-8">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  {t("state")}
                </h3>
                <Select
                  value={filters.state}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, state: value }))
                  }
                >
                  <SelectTrigger>
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

              {availableFilters.cities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
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
                    <SelectTrigger>
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

              <div className="space-y-3">
                <h3 className="font-medium">{t("topics")}</h3>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pt-1">
                  {availableFilters.topics.map((topic) => (
                    <Badge
                      key={topic}
                      variant={
                        filters.topics.includes(topic) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          topics: prev.topics.includes(topic)
                            ? prev.topics.filter((t) => t !== topic)
                            : [...prev.topics, topic]
                        }))
                      }}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-primary" />
                  {t("inclusiveTags")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.inclusiveTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        filters.inclusiveTags.includes(tag)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          inclusiveTags: prev.inclusiveTags.includes(tag)
                            ? prev.inclusiveTags.filter((t) => t !== tag)
                            : [...prev.inclusiveTags, tag]
                        }))
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
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
                  <SelectTrigger>
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

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-primary" />
                  {t("experience")}
                </h3>
                <Select
                  value={filters.experienceYears}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, experienceYears: value }))
                  }
                >
                  <SelectTrigger>
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

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setFilters(initialFilters)}
              >
                {t("clearFilters")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
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
        <div className="text-center py-20 bg-white rounded-lg border border-dashed">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            {t("noMentorsTitle")}
          </h3>
          <p className="text-gray-600 mt-2 mb-6">{t("noMentorsDescription")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setFilters(initialFilters)}
            >
              {t("clearFilters")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primeiro os sugeridos pela IA */}
            {mentors
              .filter(
                (m) => m.id && Object.keys(suggestedMentors).includes(m.id)
              )
              .map((mentor) => (
                <MentorCard
                  key={`ai-${mentor.id}`}
                  mentor={mentor}
                  isFavorite={!!(mentor.id && favorites.includes(mentor.id))}
                  onToggleFavorite={() =>
                    mentor.id && toggleFavorite(mentor.id)
                  }
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
                <MentorCard
                  key={mentor.id || "unknown"}
                  mentor={mentor}
                  isFavorite={!!(mentor.id && favorites.includes(mentor.id))}
                  onToggleFavorite={() =>
                    mentor.id && toggleFavorite(mentor.id)
                  }
                />
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
        </>
      )}
    </div>
  )
}
