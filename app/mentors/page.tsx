"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Filter, 
  Search, 
  User, 
  Briefcase, 
  MapPin, 
  Calendar, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import { useMentors, useFilterOptions } from "@/hooks/useMentors"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"
import type { MentorFilters, MentorProfile } from "@/services/mentors/mentors"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { WarningBanner } from "@/components/WarningBanner"

interface FilterState extends Omit<MentorFilters, 'page' | 'limit'> {
  page: number
  limit: number
  inclusionTags: string[]
  experienceYears: number[]
  state_province?: string
  sortBy: string 
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Add mock mentors data
const mockMentors: MentorProfile[] = [

{
    id: "1",
    first_name: "Paul",
    last_name: "Pessoa",
    avatar_url: "/images/paul-pessoa.jpg",
    current_position: "Engenheiro de Software",
    current_company: "Traive Finance",
    location: "Recife, Brasil",
    bio: "Engenheiro de software com ampla experiência em startups e hackathons. Atua principalmente com React, arquitetura modular e projetos open source. Fundador da Menvo.com.br e idealizador do Estagionauta.",
    availability: "available" as const,
    mentor_skills: [
      "React",
      "Arquitetura de Frontend",
      "Next.js",
      "Open Source",
      "Carreira em tecnologia"
    ],
    languages: ["pt-BR", "en"]
  },
  {
    id: "2",
    first_name: "Ismaela",
    last_name: "Silva",
    avatar_url: "/images/ismaela-silva.jpg",
    current_position: "Jornalista e Redatora",
    current_company: "Movimento Circular",
    location: "Recife, Brasil",
    bio: "Jornalista com experiência em redação criativa, produção de conteúdo e comunicação social. Apaixonada por educação, impacto social e iniciativas colaborativas.",
    availability: "available" as const,
    mentor_skills: [
      "Comunicação",
      "Redação criativa",
      "Jornalismo",
      "Storytelling",
      "Gestão de conteúdo"
    ],
    languages: ["pt-BR", "en"]
  }
]

export default function MentorsPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [showFilters, setShowFilters] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [selectedMentorName, setSelectedMentorName] = useState<string>()
  
  const initialFilterState: FilterState = {
    search: "",
    topics: [],
    languages: [],
    experienceYears: [],
    educationLevels: [],
    rating: undefined,
    city: "",
    country: "",
    state_province: "",
    inclusionTags: [],
    page: 1,
    limit: 12,
    sortBy: 'name-asc'
  }

  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [pendingFilters, setPendingFilters] = useState<FilterState>(initialFilterState)

  // Buscar mentores e opções de filtro
  const { data: mentorsData, isLoading, error } = useMentors({
    ...filters,
    experienceYears: Array.isArray(filters.experienceYears)
      ? filters.experienceYears.map(Number)
      : [],
    sortBy: filters.sortBy || "name-asc"
  })
  const { data: filterOptions, isLoading: isLoadingFilters } = useFilterOptions()

  // Modify the mentors data to use mock data when there's an error
  const mentorsToDisplay = mentorsData || { mentors: [], totalCount: 0, currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }

  // Handler para filtros (apenas altera o pendingFilters)
  const handlePendingFilterChange = (key: keyof FilterState, value: any) => {
    setPendingFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }))
  }

  const handleSearchChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, search: value }))
  }

  const togglePendingFilter = (filterType: 'topics' | 'languages' | 'educationLevels' | 'inclusionTags' | 'experienceYears', value: string | number) => {
    if (filterType === 'experienceYears') {
      const numValue = Number(value)
      const currentValues = pendingFilters.experienceYears as number[]
      const newValues = currentValues.includes(numValue)
        ? currentValues.filter(v => v !== numValue)
        : [...currentValues, numValue]
      handlePendingFilterChange('experienceYears', newValues)
    } else {
      const currentValues = pendingFilters[filterType] as string[]
      const newValues = currentValues.includes(value as string)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value as string]
      handlePendingFilterChange(filterType, newValues)
    }
  }

  const handleSortChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, sortBy: value }))
  }

  // Aplicar filtros ao clicar em "Aplicar Filtros"
  const applyFilters = () => {
    setFilters({ ...pendingFilters })
    setShowFilters(false)
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      search: "",
      topics: [],
      languages: [],
      experienceYears: [],
      educationLevels: [],
      rating: undefined,
      city: "",
      country: "",
      state_province: "",
      inclusionTags: [],
      page: 1,
      limit: 12,
      sortBy: 'name-asc'
    })
    setPendingFilters({
      search: "",
      topics: [],
      languages: [],
      experienceYears: [],
      educationLevels: [],
      rating: undefined,
      city: "",
      country: "",
      state_province: "",
      inclusionTags: [],
      page: 1,
      limit: 12,
      sortBy: 'name-asc'
    })
  }

  // Mostrar botão limpar apenas se algum filtro estiver ativo
  const isAnyFilterActive = useMemo(() => {
    const base = {
      search: "",
      topics: [],
      languages: [],
      experienceYears: [],
      educationLevels: [],
      rating: undefined,
      city: "",
      country: "",
      state_province: "",
      inclusionTags: [],
      page: 1,
      limit: 12,
      sortBy: 'name-asc'
    }
    return JSON.stringify({ ...pendingFilters, page: 1, limit: 12 }) !== JSON.stringify(base)
  }, [pendingFilters])

  const handleViewProfile = (mentor: MentorProfile) => {
    if (!isAuthenticated) {
      setSelectedMentorName(`${mentor.first_name} ${mentor.last_name}`)
      setLoginModalOpen(true)
      return
    }
    // Redirecionar para perfil do mentor
    window.location.href = `/mentors/${mentor.id}`
  }

  const handlePageChange = (newPage: number) => {
    handlePendingFilterChange('page', newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Componente de filtros
  const FilterSection = () => (
    <>
      {/* Mobile: botão abre modal */}
      <div className="md:hidden">
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
          {t("mentors.filtersTitle")}
        </Button>
        {showFilters && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40" onClick={() => setShowFilters(false)}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xs p-0 relative" onClick={e => e.stopPropagation()}>
              {/* Botão de fechar */}
              <button
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowFilters(false)}
                aria-label="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
              <FilterContent />
            </div>
          </div>
        )}
      </div>
    </>
  )

  const FilterContent = () => {
    const [expandedAccordions, setExpandedAccordions] = useState<string[]>(["topics", "location", "languages", "inclusionTags", "educationLevels", "experienceYears", "rating"])
    const experienceOptions = filterOptions?.experienceRanges || []
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{t("mentors.filtersTitle")}</h3>
            {isAnyFilterActive && (
              <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={clearFilters}>
                {t("mentors.clearFilters")}
              </Button>
            )}
          </div>
          <Accordion type="multiple" value={expandedAccordions} onValueChange={setExpandedAccordions}>
            {/* Tópicos */}
            {filterOptions?.topics && filterOptions.topics.length > 0 && (
              <AccordionItem className="border-none" value="topics">
                <AccordionTrigger>{t("mentors.filterOptions.topics")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filterOptions.topics.slice(0, 15).map((topic) => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Checkbox
                          id={`topic-${topic}`}
                          checked={pendingFilters.topics?.includes(topic)}
                          onCheckedChange={() => togglePendingFilter('topics', topic)}
                        />
                        <label htmlFor={`topic-${topic}`} className="text-sm font-medium leading-none">
                          {topic}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {/* Localização */}
            <AccordionItem className="border-none" value="location">
              <AccordionTrigger>{t("mentors.filterOptions.location")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  <Input
                    placeholder="Ex: São Paulo, Rio de Janeiro..."
                    value={pendingFilters.city || ""}
                    onChange={e => handlePendingFilterChange('city', e.target.value)}
                    className="mb-1"
                  />
                  <Input
                    placeholder="Ex: Brasil, Portugal..."
                    value={pendingFilters.country || ""}
                    onChange={e => handlePendingFilterChange('country', e.target.value)}
                    className="mb-1"
                  />
                  <Input
                    placeholder="Estado/Província"
                    value={pendingFilters.state_province || ""}
                    onChange={e => handlePendingFilterChange('state_province', e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* Idiomas */}
            {filterOptions?.languages && filterOptions.languages.length > 0 && (
              <AccordionItem className="border-none" value="languages">
                <AccordionTrigger>{t("mentors.filterOptions.languages")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filterOptions.languages.slice(0, 10).map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${language}`}
                          checked={pendingFilters.languages?.includes(language)}
                          onCheckedChange={() => togglePendingFilter('languages', language)}
                        />
                        <label htmlFor={`lang-${language}`} className="text-sm font-medium leading-none">
                          {language}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {/* Inclusion Tags */}
            {filterOptions?.inclusionTags && filterOptions.inclusionTags.length > 0 && (
              <AccordionItem className="border-none" value="inclusion-tags">
                <AccordionTrigger>{t("mentors.filterOptions.inclusionTags")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filterOptions.inclusionTags.slice(0, 10).map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${tag}`}
                          checked={pendingFilters.languages?.includes(tag)}
                          onCheckedChange={() => togglePendingFilter('inclusionTags', tag)}
                        />
                        <label htmlFor={`tag-${tag}`} className="text-sm font-medium leading-none">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Nível de Educação */}
            {filterOptions?.educationLevels && filterOptions.educationLevels.length > 0 && (
              <AccordionItem className="border-none" value="educationLevels">
                <AccordionTrigger>{t("mentors.filterOptions.education")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filterOptions.educationLevels.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edu-${level}`}
                          checked={pendingFilters.educationLevels?.includes(level)}
                          onCheckedChange={() => togglePendingFilter('educationLevels', level)}
                        />
                        <label htmlFor={`edu-${level}`} className="text-sm font-medium leading-none">
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {/* Experiência */}
            <AccordionItem className="border-none" value="experienceYears">
              <AccordionTrigger>{t("mentors.filterOptions.experience")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {experienceOptions.map((exp) => (
                    <div key={exp.label} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exp-${exp.label}`}
                        checked={pendingFilters.experienceYears?.includes(exp.min)}
                        onCheckedChange={() => togglePendingFilter('experienceYears', exp.min)}
                      />
                      <label htmlFor={`exp-${exp.label}`} className="text-sm font-medium leading-none">
                        {exp.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* Rating */}
            <AccordionItem className="border-none" value="rating">
              <AccordionTrigger>{t("mentors.filterOptions.rating")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {["4+ stars", "3+ stars", "2+ stars"].map((rating, idx) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={pendingFilters.rating === 4 - idx}
                        onCheckedChange={() => handlePendingFilterChange('rating', pendingFilters.rating === 4 - idx ? undefined : 4 - idx)}
                      />
                      <label htmlFor={`rating-${rating}`} className="text-sm font-medium leading-none">
                        {rating}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Button className="w-full mt-4" onClick={applyFilters}>{t("mentors.applyFilters")}</Button>
        </div>
      </Card>
    )
  }

  // Ordenação
  const sortOptions = [
    { value: "name-asc", label: t("mentors.sortOptions.name") + " (A-Z)" },
    { value: "name-desc", label: t("mentors.sortOptions.name") + " (Z-A)" },
    { value: "experience-asc", label: t("mentors.sortOptions.experience") + " (↑)" },
    { value: "experience-desc", label: t("mentors.sortOptions.experience") + " (↓)" },
    { value: "rating-asc", label: t("mentors.sortOptions.rating") + " (↑)" },
    { value: "rating-desc", label: t("mentors.sortOptions.rating") + " (↓)" },
  ]

  return (
    <div className="container py-8 md:py-12">
      <WarningBanner />
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("mentors.title")}</h1>
          <p className="text-muted-foreground">
            {t("mentors.description")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder={t("mentors.searchPlaceholder")}
              className="w-full pl-10"
              value={pendingFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Mobile: FilterSection + ClearFilters centralizados */}
          <div className="flex gap-2 justify-center items-center w-full md:hidden">
            <FilterSection />
            {isAnyFilterActive && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="whitespace-nowrap"
              >
                {t("mentors.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="hidden md:block">
            <FilterContent />
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading 
                  ? t("common.loading")
                  : t("mentors.showingResults", { count: mentorsToDisplay?.totalCount || 0 })
                }
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("mentors.sortBy")}:</span>
                <Select value={pendingFilters.sortBy || 'name-asc'} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mentors Grid */}
            {isLoading ? (
              <MentorsGridSkeleton />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">Usando dados de exemplo enquanto o banco de dados está indisponível.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockMentors.map((mentor) => (
                    <MentorCard 
                      key={mentor.id} 
                      mentor={mentor} 
                      onViewProfile={() => handleViewProfile(mentor)}
                    />
                  ))}
                </div>
              </div>
            ) : mentorsToDisplay?.mentors && mentorsToDisplay.mentors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mentorsToDisplay.mentors.map((mentor) => (
                    <MentorCard 
                      key={mentor.id} 
                      mentor={mentor} 
                      onViewProfile={() => handleViewProfile(mentor)}
                    />
                  ))}
                </div>
                
                {/* Paginação */}
                {!error && mentorsToDisplay.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={!mentorsToDisplay.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      {t("mentors.pagination.previous")}
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      {t("mentors.pagination.page", { 
                        current: mentorsToDisplay.currentPage, 
                        total: mentorsToDisplay.totalPages 
                      })}
                    </span>
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={!mentorsToDisplay.hasNextPage}
                    >
                      {t("mentors.pagination.next")}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("mentors.noMentorsFound")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("mentors.noMentorsDescription")}
                </p>
                <Button onClick={clearFilters} variant="outline">
                  {t("mentors.clearFiltersButton")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        mentorName={selectedMentorName}
      />
    </div>
  )
}

function MentorCard({ mentor, onViewProfile }: { 
  mentor: MentorProfile
  onViewProfile: () => void
}) {
  const { t } = useTranslation()
  const fullName = `${mentor.first_name} ${mentor.last_name}`
  const isAvailable = mentor.availability === 'available'
  const mentorSkills = mentor.mentor_skills || []

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full bg-gradient-to-br from-primary-100 to-primary-200">
          {mentor.avatar_url ? (
            <Image
              src={mentor.avatar_url}
              alt={fullName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <User className="h-12 w-12 text-primary-600" />
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={isAvailable ? "default" : "secondary"}
              className={isAvailable ? "bg-green-500" : ""}
            >
              {isAvailable ? t("mentors.mentorCard.available") : t("mentors.mentorCard.busy")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Name and Title */}
          <div>
            <h3 className="font-semibold text-lg leading-tight">{fullName}</h3>
            {mentor.current_position && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Briefcase className="h-3 w-3" />
                <span>{mentor.current_position}</span>
                {mentor.current_company && (
                  <span> • {mentor.current_company}</span>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          {mentor.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{mentor.location}</span>
            </div>
          )}

          {/* Bio Preview */}
          {mentor.bio ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {mentor.bio}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t("mentors.mentorCard.noBio")}
            </p>
          )}

          {/* Skills Preview */}
          {mentorSkills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("mentors.mentorCard.specialties")}</p>
              <div className="flex flex-wrap gap-1">
                {mentorSkills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {mentorSkills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{mentorSkills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button onClick={onViewProfile} className="flex-1">
          {t("mentors.mentorCard.viewProfile")}
        </Button>
        {isAvailable && (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function MentorsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="p-0">
            <Skeleton className="h-48 w-full rounded-none" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
