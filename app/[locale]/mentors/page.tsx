"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
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
  MessageCircle,
  Loader2
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { SuggestionModal } from "@/components/mentors/SuggestionModal"
import { useMentorSuggestion } from "@/hooks/useMentorSuggestion"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface MentorProfile {
  id: string
  full_name: string
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
  session_price_usd: number | null
  availability_status: string
  average_rating: number
  total_reviews: number
  total_sessions: number
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
  const { isModalOpen, openModal, closeModal, handleSubmit } = useMentorSuggestion()

  const fetchMentors = useCallback(async (isReset = false) => {
    const currentPage = isReset ? 0 : page
    if (isReset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      let query = supabase
        .from('mentors_view')
        .select(`
          id,
          full_name,
          avatar_url,
          bio,
          current_position,
          current_company,
          city,
          state,
          country,
          languages,
          mentorship_topics,
          inclusion_tags,
          expertise_areas,
          session_price_usd,
          availability_status,
          rating,
          reviews,
          sessions,
          experience_years,
          slug
        `, { count: 'exact' })

      // Apply Filters
      if (filters.search) {
        const searchTerm = `%${filters.search}%`
        query = query.or(`full_name.ilike.${searchTerm},current_position.ilike.${searchTerm},current_company.ilike.${searchTerm},bio.ilike.${searchTerm}`)
      }

      if (filters.country !== 'all') {
        query = query.eq('country', filters.country)
      }
      if (filters.state !== 'all') {
        query = query.eq('state', filters.state)
      }
      if (filters.city) {
        query = query.eq('city', filters.city)
      }
      if (filters.availabilityStatus !== 'all') {
        query = query.eq('availability_status', filters.availabilityStatus)
      }

      if (filters.languages.length > 0) {
        query = query.contains('languages', filters.languages)
      }
      if (filters.topics.length > 0) {
        query = query.contains('mentorship_topics', filters.topics)
      }
      if (filters.inclusiveTags.length > 0) {
        query = query.contains('inclusion_tags', filters.inclusiveTags)
      }

      if (filters.experienceYears !== 'all') {
        const [min, max] = filters.experienceYears.split('-').map(Number)
        if (max) {
          query = query.gte('experience_years', min).lte('experience_years', max)
        } else {
          query = query.gte('experience_years', min)
        }
      }

      // Pagination
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      
      query = query
        .order('rating', { ascending: false })
        .order('sessions', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      const mappedData = (data || []).map((mentor: any) => ({
        ...mentor,
        job_title: mentor.current_position,
        company: mentor.current_company,
        inclusive_tags: mentor.inclusion_tags,
        average_rating: mentor.rating,
        total_reviews: mentor.reviews,
        total_sessions: mentor.sessions
      }))

      if (isReset) {
        setMentors(mappedData)
        setPage(0)
      } else {
        setMentors(prev => [...prev, ...mappedData])
      }

      setTotalCount(count || 0)
      setHasMore((count || 0) > (from + mappedData.length))
      
    } catch (error) {
      console.error('Error fetching mentors:', error)
      toast.error(t("errorFetchingMentors", { defaultValue: "Erro ao carregar mentores" }))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, page, supabase, t])

  const fetchFilterOptions = async () => {
    try {
      // Fetch unique filter values - optimize by selecting only relevant columns
      // For very large datasets, this should be a cached RPC or a separate table
      const { data, error } = await supabase
        .from('mentors_view')
        .select(`
          country,
          state,
          city,
          languages,
          mentorship_topics,
          inclusion_tags,
          expertise_areas
        `)
        .limit(1000) // Safety limit

      if (error) throw error

      const countries = new Set<string>()
      const states = new Set<string>()
      const cities = new Set<string>()
      const languages = new Set<string>()
      const topics = new Set<string>()
      const inclusiveTags = new Set<string>()

      data?.forEach((mentor: any) => {
        if (mentor.country) countries.add(mentor.country)
        if (mentor.state) states.add(mentor.state)
        if (mentor.city) cities.add(mentor.city)

        mentor.languages?.forEach((lang: string) => languages.add(lang))
        mentor.mentorship_topics?.forEach((topic: string) => topics.add(topic))
        mentor.inclusion_tags?.forEach((tag: string) => inclusiveTags.add(tag))
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
      console.error('Error fetching filter options:', error)
    }
  }

  // Effect to handle initial load and filter changes
  useEffect(() => {
    fetchMentors(true)
  }, [filters.search, filters.country, filters.state, filters.city, filters.languages, filters.topics, filters.inclusiveTags, filters.availabilityStatus, filters.experienceYears])

  // Initial load of filter options
  useEffect(() => {
    fetchFilterOptions()
  }, [])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  // Trigger load more when page changes (except for reset)
  useEffect(() => {
    if (page > 0) {
      fetchMentors(false)
    }
  }, [page])

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.country !== 'all') count++
    if (filters.state !== 'all') count++
    if (filters.city) count++
    if (filters.languages.length > 0) count++
    if (filters.topics.length > 0) count++
    if (filters.inclusiveTags.length > 0) count++
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 500) count++
    if (filters.availabilityStatus !== 'all') count++
    if (filters.experienceYears !== 'all') count++
    return count
  }, [filters])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("title")}
        </h1>
        <p className="text-gray-600">
          {t("subtitle")}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              {t("filters")}
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("sheetTitle")}</SheetTitle>
              <SheetDescription>
                {t("sheetDescription")}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {t("state")}
                </h3>
                <Select value={filters.state} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, state: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder={t("statePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStates")}</SelectItem>
                    {availableFilters.states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableFilters.cities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t("city")}
                  </h3>
                  <Select value={filters.city || "all"} onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, city: value === "all" ? "" : value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={t("cityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allCities")}</SelectItem>
                      {availableFilters.cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-medium">{t("topics")}</h3>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {availableFilters.topics.map(topic => (
                    <Badge
                      key={topic}
                      variant={filters.topics.includes(topic) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          topics: prev.topics.includes(topic)
                            ? prev.topics.filter(t => t !== topic)
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
                  <Heart className="h-4 w-4 mr-2" />
                  {t("inclusiveTags")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.inclusiveTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.inclusiveTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          inclusiveTags: prev.inclusiveTags.includes(tag)
                            ? prev.inclusiveTags.filter(t => t !== tag)
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
                  <Briefcase className="h-4 w-4 mr-2" />
                  {t("experience")}
                </h3>
                <Select value={filters.experienceYears} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, experienceYears: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder={t("experiencePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("anyExperience")}</SelectItem>
                    <SelectItem value="1-3">1-3 anos</SelectItem>
                    <SelectItem value="3-5">3-5 anos</SelectItem>
                    <SelectItem value="5-10">5-10 anos</SelectItem>
                    <SelectItem value="10">10+ anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {t("availability")}
                </h3>
                <Select value={filters.availabilityStatus} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, availabilityStatus: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder={t("availabilityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("anyStatus")}</SelectItem>
                    <SelectItem value="available">{t("status.available")}</SelectItem>
                    <SelectItem value="busy">{t("status.busy")}</SelectItem>
                    <SelectItem value="unavailable">{t("status.unavailable")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
                disabled={activeFiltersCount === 0}
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
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <Button 
                onClick={loadMore} 
                disabled={loadingMore}
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  t("loadMore", { defaultValue: "Carregar Mais" })
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {mentors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noMentorsTitle")}
          </h3>
          <p className="text-gray-600 mb-4">
            {t("noMentorsDescription")}
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={clearFilters} variant="outline">
              {t("clearFilters")}
            </Button>
            <Button onClick={openModal}>
              {t("suggestTopic")}
            </Button>
          </div>
        </div>
      )}

      <SuggestionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={(suggestion) => handleSubmit(user?.id || "", suggestion)}
        userId={user?.id || null}
      />
    </div>
  )
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function MentorCard({ mentor }: { mentor: MentorProfile }) {
  const t = useTranslations("mentorsPage")
  const router = useRouter()
  const { user } = useAuth()

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'unavailable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return t("status.available")
      case 'busy': return t("status.busy")
      case 'unavailable': return t("status.unavailable")
      default: return t("status.unknown")
    }
  }

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/mentors/${mentor.slug || mentor.id}`)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast.info("Você deve estar logado para favoritar mentores")
      return
    }
    toast.success("Mentor favoritado com sucesso!")
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={mentor.avatar_url || undefined} />
              <AvatarFallback>
                {mentor.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg line-clamp-1">{mentor.full_name}</CardTitle>
              <CardDescription className="text-sm line-clamp-1">
                {mentor.job_title}
                {mentor.company && ` @ ${mentor.company}`}
              </CardDescription>
            </div>
          </div>
          <Badge className={`${getAvailabilityColor(mentor.availability_status)} whitespace-nowrap`}>
            {getAvailabilityText(mentor.availability_status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {mentor.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {mentor.bio}
          </p>
        )}

        {(mentor.city || mentor.country) && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate">
              {[mentor.city, mentor.state, mentor.country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {mentor.mentorship_topics.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
            {mentor.mentorship_topics.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{mentor.mentorship_topics.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <div className="flex items-center">
            <MessageCircle className="h-3 w-3 mr-1" />
            <span>{t("sessionsCount", { count: mentor.total_sessions || 0 })}</span>
          </div>
        </div>

        <div className="flex space-x-2 pt-2 mt-auto">
          <Button onClick={handleScheduleClick} className="flex-1">
            {t("viewProfile")}
          </Button>
          <Button variant="outline" size="icon" onClick={handleFavoriteClick}>
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}