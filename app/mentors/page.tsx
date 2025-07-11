"use client"

import { useState, useMemo, useCallback, Suspense } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter, Search, User, Briefcase, MapPin, Calendar, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useMentors, useFilterOptions } from "@/hooks/useMentors"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useAuth } from "@/hooks/useAuth"
import type { MentorFilters, MentorProfile } from "@/services/mentors/mentors"
import { WarningBanner } from "@/components/WarningBanner"

interface FilterState extends Omit<MentorFilters, "page" | "limit"> {
  page: number
  limit: number
  inclusionTags: string[]
  experienceYears: number[]
  state_province?: string
  sortBy: string
}

function MentorsContent() {
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
    sortBy: "created_at-desc",
  }

  const [filters, setFilters] = useState<FilterState>(initialFilterState)

  const {
    data: mentorsData,
    isLoading,
    error,
  } = useMentors({
    ...filters,
    experienceYears: Array.isArray(filters.experienceYears) ? filters.experienceYears.map(Number) : [],
    sortBy: filters.sortBy || "created_at-desc",
  })

  const { data: filterOptions } = useFilterOptions()

  const handleViewProfile = useCallback(
    (mentor: MentorProfile) => {
      if (!isAuthenticated) {
        setSelectedMentorName(`${mentor.first_name} ${mentor.last_name}`)
        setLoginModalOpen(true)
        return
      }
      window.location.href = `/mentors/${mentor.id}`
    },
    [isAuthenticated],
  )

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState)
  }, [])

  const isAnyFilterActive = useMemo(() => {
    return JSON.stringify({ ...filters, page: 1, limit: 12 }) !== JSON.stringify(initialFilterState)
  }, [filters])

  const sortOptions = [
    { value: "first_name-asc", label: "Nome (A-Z)" },
    { value: "first_name-desc", label: "Nome (Z-A)" },
    { value: "created_at-desc", label: "Mais Novos" },
    { value: "created_at-asc", label: "Mais Antigos" },
    { value: "rating-desc", label: "Melhor Avaliados" },
    { value: "total_sessions-desc", label: "Mais Experientes" },
  ]

  return (
    <div className="container py-8 md:py-12">
      <WarningBanner />
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Encontre seu Mentor</h1>
          <p className="text-muted-foreground">Conecte-se com profissionais experientes para acelerar sua carreira</p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, empresa, habilidade..."
              className="w-full pl-10"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex items-center gap-2 md:hidden bg-transparent"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            {isAnyFilterActive && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="hidden md:block">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Filtros</h3>
              {/* Simplified filters for MVP */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <Input
                    placeholder="Cidade"
                    value={filters.city || ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value, page: 1 }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : `${mentorsData?.totalCount || 0} mentores encontrados`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value, page: 1 }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
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
                <p className="text-muted-foreground mb-6">Erro ao carregar mentores. Tente novamente.</p>
                <Button onClick={() => window.location.reload()}>Recarregar</Button>
              </div>
            ) : mentorsData?.mentors && mentorsData.mentors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mentorsData.mentors.map((mentor) => (
                    <MentorCard key={mentor.id} mentor={mentor} onViewProfile={() => handleViewProfile(mentor)} />
                  ))}
                </div>

                {/* Pagination */}
                {mentorsData.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!mentorsData.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Página {mentorsData.currentPage} de {mentorsData.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!mentorsData.hasNextPage}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum mentor encontrado</h3>
                <p className="text-muted-foreground mb-4">Tente ajustar seus filtros de busca</p>
                <Button onClick={clearFilters} variant="outline">
                  Limpar Filtros
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

function MentorCard({
  mentor,
  onViewProfile,
}: {
  mentor: MentorProfile
  onViewProfile: () => void
}) {
  const fullName = `${mentor.first_name} ${mentor.last_name}`
  const isAvailable = mentor.availability === "available"
  const mentorSkills = mentor.mentor_skills || []
  const rating = mentor.rating || 0
  const totalSessions = mentor.total_sessions || 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full bg-gradient-to-br from-primary-100 to-primary-200">
          {mentor.avatar_url ? (
            <Image src={mentor.avatar_url || "/placeholder.svg"} alt={fullName} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <User className="h-12 w-12 text-primary-600" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? "bg-green-500" : ""}>
              {isAvailable ? "Disponível" : "Ocupado"}
            </Badge>
          </div>
          {rating > 0 && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{fullName}</h3>
            {mentor.current_position && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Briefcase className="h-3 w-3" />
                <span>{mentor.current_position}</span>
                {mentor.current_company && <span> • {mentor.current_company}</span>}
              </div>
            )}
          </div>

          {mentor.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{mentor.location}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {mentor.years_experience && <span>{mentor.years_experience} anos exp.</span>}
            {totalSessions > 0 && <span>{totalSessions} sessões</span>}
          </div>

          {mentorSkills.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-1">
                {mentorSkills.slice(0, 3).map((skill) => (
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
          Ver Perfil
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

export default function MentorsPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <MentorsContent />
    </Suspense>
  )
}
