"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  MessageCircle,
  Loader2,
  Building2,
  Plus
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { SuggestionModal } from "@/components/mentors/SuggestionModal"
import { useMentorSuggestion } from "@/hooks/useMentorSuggestion"
import { useFavorites } from "@/hooks/useFavorites"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  organization_ids: string[] | null
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
  organizationId: string
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
  organizationId: "all"
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
    inclusiveTags: [] as string[],
    organizations: [] as { id: string, name: string }[]
  })

  const supabase = createClient()
  const { user } = useAuth()
  const { isModalOpen, openModal, closeModal, handleSubmit } = useMentorSuggestion()
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

      let query = supabase
        .from('mentors_view')
        .select(`
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
          expertise_areas,
          session_price_usd,
          availability_status,
          average_rating,
          total_reviews,
          total_sessions,
          experience_years,
          slug,
          organization_ids
        `, { count: 'exact' })

      // Apply Filters
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.trim()}%`
        query = query.or(`full_name.ilike.${searchTerm},job_title.ilike.${searchTerm},company.ilike.${searchTerm},bio.ilike.${searchTerm}`)
      }

      if (filters.organizationId && filters.organizationId !== 'all') {
        query = query.contains('organization_ids', [filters.organizationId])
      }

      if (filters.country && filters.country !== 'all') {
        query = query.eq('country', filters.country)
      }

      if (filters.state && filters.state !== 'all') {
        query = query.eq('state', filters.state)
      }

      if (filters.city && filters.city.trim() !== '') {
        query = query.ilike('city', `%${filters.city.trim()}%`)
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

      if (filters.availabilityStatus !== 'all') {
        query = query.eq('availability_status', filters.availabilityStatus)
      }

      if (filters.experienceYears !== 'all') {
        const parts = filters.experienceYears.split('-')
        const min = parseInt(parts[0])
        const max = parts[1] ? parseInt(parts[1]) : null
        
        if (!isNaN(min)) {
          query = query.gte('experience_years', min)
        }
        if (max && !isNaN(max)) {
          query = query.lte('experience_years', max)
        }
      }

      // Pagination
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      
      query = query
        .order('average_rating', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      if (isInitial) {
        setMentors(data || [])
      } else {
        setMentors(prev => [...prev, ...(data || [])])
      }

      setTotalCount(count || 0)
      setHasMore((count || 0) > (from + (data?.length || 0)))
    } catch (error) {
      console.error('Error fetching mentors:', error)
      toast.error(t("errorLoadingMentors"))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('country, state, city, languages, mentorship_topics, inclusion_tags')

      if (error) throw error

      const countries = new Set<string>()
      const states = new Set<string>()
      const cities = new Set<string>()
      const languages = new Set<string>()
      const topics = new Set<string>()
      const inclusiveTags = new Set<string>()

      ;(data as any[])?.forEach(mentor => {
        if (mentor.country) countries.add(mentor.country)
        if (mentor.state) states.add(mentor.state)
        if (mentor.city) cities.add(mentor.city)
        mentor.languages?.forEach((l: string) => languages.add(l))
        mentor.mentorship_topics?.forEach((t: string) => topics.add(t))
        mentor.inclusion_tags?.forEach((t: string) => inclusiveTags.add(t))
      })

      // Fetch active organizations
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      setAvailableFilters({
        countries: Array.from(countries).sort(),
        states: Array.from(states).sort(),
        cities: Array.from(cities).sort(),
        languages: Array.from(languages).sort(),
        topics: Array.from(topics).sort(),
        inclusiveTags: Array.from(inclusiveTags).sort(),
        organizations: orgData || []
      })
    } catch (error) {
      console.error('Error fetching filter options:', error)
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
    if (filters.country !== 'all') count++
    if (filters.state !== 'all') count++
    if (filters.city) count++
    if (filters.languages.length > 0) count++
    if (filters.topics.length > 0) count++
    if (filters.inclusiveTags.length > 0) count++
    if (filters.availabilityStatus !== 'all') count++
    if (filters.experienceYears !== 'all') count++
    if (filters.organizationId !== 'all') count++
    return count
  }, [filters])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    fetchMentors(false)
  }

  const handleSuggestClick = () => {
    if (!user) {
      toast.info("Você precisa estar logado para sugerir temas")
      return
    }
    openModal()
  }

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
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground">
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

            <div className="mt-6 space-y-6 pb-8">
              {/* Organization Filter */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-primary" />
                  {t("organization")}
                </h3>
                <Select value={filters.organizationId} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, organizationId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder={t("organizationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allOrganizations")}</SelectItem>
                    {availableFilters.organizations?.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
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
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
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
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pt-1">
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
                  <Heart className="h-4 w-4 mr-2 text-primary" />
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
                  <Clock className="h-4 w-4 mr-2 text-primary" />
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-primary" />
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
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t("noMentorsTitle")}</h3>
          <p className="text-gray-600 mt-2 mb-6">{t("noMentorsDescription")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setFilters(initialFilters)}
            >
              {t("clearFilters")}
            </Button>
            <Button onClick={handleSuggestClick} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("suggestTopic")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <MentorCard 
                key={mentor.id} 
                mentor={mentor} 
                isFavorite={favorites.includes(mentor.id)}
                onToggleFavorite={() => toggleFavorite(mentor.id)}
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

      {/* Suggestion Modal Triggered by Hook */}
      <SuggestionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={(suggestion) => handleSubmit(user?.id || "", suggestion)}
        userId={user?.id || null}
        availableInclusionTags={availableFilters.inclusiveTags}
      />
    </div>
  )
}

function SkeletonCard({ key }: { key: number }) {
  return (
    <Card key={key} className="animate-pulse">
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

function MentorCard({ 
  mentor, 
  isFavorite, 
  onToggleFavorite 
}: { 
  mentor: MentorProfile, 
  isFavorite: boolean,
  onToggleFavorite: () => void 
}) {
  const t = useTranslations("mentorsPage")
  const router = useRouter()

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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full relative">
      <button 
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite();
        }}
        className={`absolute top-4 right-4 p-2 rounded-full shadow-sm transition-all z-10 ${
          isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-400'
        }`}
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

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
              <CardTitle className="text-lg line-clamp-1 pr-8">{mentor.full_name}</CardTitle>
              <CardDescription className="text-sm line-clamp-1">
                {mentor.job_title}
                {mentor.company && ` @ ${mentor.company}`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
            <Badge className={`${getAvailabilityColor(mentor.availability_status)} whitespace-nowrap`}>
                {getAvailabilityText(mentor.availability_status)}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                {mentor.average_rating.toFixed(1)} ({mentor.total_reviews})
            </div>
        </div>

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

        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
          <div className="flex items-center">
            <MessageCircle className="h-3 w-3 mr-1" />
            <span>{t("sessionsCount", { count: mentor.total_sessions || 0 })}</span>
          </div>
          {mentor.experience_years && (
             <span>{mentor.experience_years} {t("years")}</span>
          )}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button onClick={handleScheduleClick} className="flex-1">
            {t("viewProfile")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
