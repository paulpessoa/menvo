"use client"

import { useState, useEffect, useMemo } from "react"
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
  Star,
  Clock,
  DollarSign,
  Users,
  Globe,
  Briefcase,
  Heart,
  Calendar,
  MessageCircle
} from "lucide-react"
import Link from "next/link"

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
  minRating: number
  experienceYears: string
}

const initialFilters: FilterState = {
  search: "",
  country: "",
  state: "",
  city: "",
  languages: [],
  topics: [],
  inclusiveTags: [],
  priceRange: [0, 500],
  availabilityStatus: "",
  minRating: 0,
  experienceYears: ""
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchMentors()
    fetchFilterOptions()
  }, [])

  const fetchMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
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
          inclusive_tags,
          expertise_areas,
          session_price_usd,
          availability_status,
          average_rating,
          total_reviews,
          total_sessions,
          experience_years,
          slug,
          user_roles!inner(
            roles!inner(name)
          )
        `)
        .eq('verified', true)
        .eq('user_roles.roles.name', 'mentor')
        .order('average_rating', { ascending: false })
        .order('total_sessions', { ascending: false })

      if (error) throw error
      setMentors(data || [])
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          country,
          state,
          city,
          languages,
          mentorship_topics,
          inclusive_tags,
          user_roles!inner(
            roles!inner(name)
          )
        `)
        .eq('verified', true)
        .eq('user_roles.roles.name', 'mentor')

      if (error) throw error

      const countries = new Set<string>()
      const states = new Set<string>()
      const cities = new Set<string>()
      const languages = new Set<string>()
      const topics = new Set<string>()
      const inclusiveTags = new Set<string>()

      data?.forEach(mentor => {
        if (mentor.country) countries.add(mentor.country)
        if (mentor.state) states.add(mentor.state)
        if (mentor.city) cities.add(mentor.city)

        mentor.languages?.forEach(lang => languages.add(lang))
        mentor.mentorship_topics?.forEach(topic => topics.add(topic))
        mentor.inclusive_tags?.forEach(tag => inclusiveTags.add(tag))
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

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          mentor.full_name,
          mentor.bio,
          mentor.job_title,
          mentor.company,
          ...(mentor.mentorship_topics || []),
          ...(mentor.expertise_areas || [])
        ].join(' ').toLowerCase()

        if (!searchableText.includes(searchTerm)) return false
      }

      // Location filters
      if (filters.country && mentor.country !== filters.country) return false
      if (filters.state && mentor.state !== filters.state) return false
      if (filters.city && mentor.city !== filters.city) return false

      // Language filter
      if (filters.languages.length > 0) {
        const mentorLanguages = mentor.languages || []
        if (!filters.languages.some(lang => mentorLanguages.includes(lang))) return false
      }

      // Topics filter
      if (filters.topics.length > 0) {
        const mentorTopics = mentor.mentorship_topics || []
        if (!filters.topics.some(topic => mentorTopics.includes(topic))) return false
      }

      // Inclusive tags filter
      if (filters.inclusiveTags.length > 0) {
        const mentorTags = mentor.inclusive_tags || []
        if (!filters.inclusiveTags.some(tag => mentorTags.includes(tag))) return false
      }

      // Price range filter
      if (mentor.session_price_usd !== null) {
        if (mentor.session_price_usd < filters.priceRange[0] ||
          mentor.session_price_usd > filters.priceRange[1]) return false
      }

      // Availability status filter
      if (filters.availabilityStatus && mentor.availability_status !== filters.availabilityStatus) return false

      // Rating filter
      if (filters.minRating > 0 && mentor.average_rating < filters.minRating) return false

      // Experience years filter
      if (filters.experienceYears && mentor.experience_years !== null) {
        const [min, max] = filters.experienceYears.split('-').map(Number)
        if (max) {
          if (mentor.experience_years < min || mentor.experience_years > max) return false
        } else {
          if (mentor.experience_years < min) return false
        }
      }

      return true
    })
  }, [mentors, filters])

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value !== ''
    if (typeof value === 'number') return value > 0
    return false
  }).length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Encontre seu Mentor Ideal
        </h1>
        <p className="text-gray-600">
          Conecte-se com mentores verificados e acelere sua carreira
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, especialidade, empresa..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros Avançados</SheetTitle>
              <SheetDescription>
                Refine sua busca para encontrar o mentor perfeito
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Location Filters */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Localização
                </h3>
                <Select value={filters.country} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, country: value, state: "", city: "" }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="País" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os países</SelectItem>
                    {availableFilters.countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {filters.country && (
                  <Select value={filters.state} onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, state: value, city: "" }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os estados</SelectItem>
                      {availableFilters.states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Experience Filter */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Experiência
                </h3>
                <Select value={filters.experienceYears} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, experienceYears: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Anos de experiência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer experiência</SelectItem>
                    <SelectItem value="1-3">1-3 anos</SelectItem>
                    <SelectItem value="3-5">3-5 anos</SelectItem>
                    <SelectItem value="5-10">5-10 anos</SelectItem>
                    <SelectItem value="10">10+ anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Filter */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Disponibilidade
                </h3>
                <Select value={filters.availabilityStatus} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, availabilityStatus: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Status de disponibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer status</SelectItem>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Avaliação Mínima
                </h3>
                <Select value={filters.minRating.toString()} onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, minRating: Number(value) }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Avaliação mínima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Qualquer avaliação</SelectItem>
                    <SelectItem value="3">3+ estrelas</SelectItem>
                    <SelectItem value="4">4+ estrelas</SelectItem>
                    <SelectItem value="4.5">4.5+ estrelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
                disabled={activeFiltersCount === 0}
              >
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 'es' : ''} encontrado{filteredMentors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>

      {/* Empty State */}
      {filteredMentors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum mentor encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Tente ajustar seus filtros para encontrar mais mentores
          </p>
          <Button onClick={clearFilters} variant="outline">
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}

function MentorCard({ mentor }: { mentor: MentorProfile }) {
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
      case 'available': return 'Disponível'
      case 'busy': return 'Ocupado'
      case 'unavailable': return 'Indisponível'
      default: return 'Status desconhecido'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentor.avatar_url || undefined} />
              <AvatarFallback>
                {mentor.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{mentor.full_name}</CardTitle>
              <CardDescription className="text-sm">
                {mentor.job_title}
                {mentor.company && ` @ ${mentor.company}`}
              </CardDescription>
            </div>
          </div>
          <Badge className={getAvailabilityColor(mentor.availability_status)}>
            {getAvailabilityText(mentor.availability_status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        {mentor.bio && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {mentor.bio}
          </p>
        )}

        {/* Location */}
        {(mentor.city || mentor.country) && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            {[mentor.city, mentor.state, mentor.country].filter(Boolean).join(', ')}
          </div>
        )}

        {/* Topics */}
        {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
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

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {mentor.average_rating > 0 && (
              <div className="flex items-center">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{mentor.average_rating.toFixed(1)}</span>
                <span className="ml-1">({mentor.total_reviews})</span>
              </div>
            )}

            {mentor.total_sessions > 0 && (
              <div className="flex items-center">
                <MessageCircle className="h-3 w-3 mr-1" />
                <span>{mentor.total_sessions} sessões</span>
              </div>
            )}
          </div>

          {mentor.session_price_usd && (
            <div className="flex items-center font-medium text-green-600">
              <DollarSign className="h-3 w-3" />
              <span>{mentor.session_price_usd}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button asChild className="flex-1">
            <Link href={`/mentors/${mentor.slug || mentor.id}`}>
              Ver Perfil
            </Link>
          </Button>
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
