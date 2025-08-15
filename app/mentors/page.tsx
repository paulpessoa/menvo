"use client"

import { Calendar } from "@/components/ui/calendar"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Search, MapPin, Star, Users, Filter, X, Clock, CheckCircle, Briefcase, Languages, Heart } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { WaitingList } from "@/components/WaitingList"

interface Mentor {
  id: string
  full_name: string
  first_name: string
  last_name: string
  avatar_url?: string
  bio?: string
  mentor_skills: string[]
  current_position?: string
  current_company?: string
  location?: string
  city?: string
  state?: string
  country?: string
  languages?: string[]
  rating?: number
  total_sessions?: number
  availability: "available" | "busy" | "unavailable"
  years_experience?: number
  verified_at?: string
  created_at: string
}

interface MentorFilters {
  search: string
  skills: string[]
  languages: string[]
  locations: string[]
  availability: string
  experience: string[]
  verified: boolean
}

const SKILLS_OPTIONS = [
  "Tecnologia",
  "Marketing",
  "Vendas",
  "Recursos Humanos",
  "Finanças",
  "Design",
  "Produto",
  "Estratégia",
  "Liderança",
  "Empreendedorismo",
  "Desenvolvimento Web",
  "Data Science",
  "UX/UI",
  "Gestão de Projetos",
]

const LANGUAGES_OPTIONS = ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"]

const LOCATIONS_OPTIONS = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Brasília",
  "Porto Alegre",
  "Recife",
  "Salvador",
  "Fortaleza",
  "Curitiba",
  "Remoto",
]

const EXPERIENCE_OPTIONS = ["1-3 anos", "3-5 anos", "5-10 anos", "10+ anos"]

function MentorsContent() {
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<MentorFilters>({
    search: searchParams.get("search") || "",
    skills: [],
    languages: [],
    locations: [],
    availability: "all",
    experience: [],
    verified: false,
  })

  const supabase = createClient()

  const {
    data: mentors,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["mentors", filters],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").eq("role", "mentor").eq("status", "active")

      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,` +
            `bio.ilike.%${filters.search}%,` +
            `current_position.ilike.%${filters.search}%,` +
            `current_company.ilike.%${filters.search}%,` +
            `mentor_skills.cs.{${filters.search}}`,
        )
      }

      if (filters.skills.length > 0) {
        query = query.overlaps("mentor_skills", filters.skills)
      }

      if (filters.languages.length > 0) {
        query = query.overlaps("languages", filters.languages)
      }

      if (filters.locations.length > 0) {
        const locationConditions = filters.locations
          .map((loc) => `city.ilike.%${loc}%,state.ilike.%${loc}%,country.ilike.%${loc}%`)
          .join(",")
        query = query.or(locationConditions)
      }

      if (filters.availability !== "all") {
        query = query.eq("availability", filters.availability)
      }

      if (filters.verified) {
        query = query.not("verified_at", "is", null)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar mentores:", error)
        return []
      }

      return data as Mentor[]
    },
  })

  const handleFilterChange = (key: keyof MentorFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSkillToggle = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }))
  }

  const handleLanguageToggle = (language: string) => {
    setFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }))
  }

  const handleLocationToggle = (location: string) => {
    setFilters((prev) => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location],
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      skills: [],
      languages: [],
      locations: [],
      availability: "all",
      experience: [],
      verified: false,
    })
  }

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case "available":
        return { text: "Disponível", variant: "default" as const, color: "text-green-600" }
      case "busy":
        return { text: "Ocupado", variant: "secondary" as const, color: "text-yellow-600" }
      default:
        return { text: "Indisponível", variant: "outline" as const, color: "text-gray-600" }
    }
  }

  const formatLocation = (mentor: Mentor) => {
    if (mentor.city && mentor.state) {
      return `${mentor.city}, ${mentor.state}`
    }
    if (mentor.city) return mentor.city
    if (mentor.location) return mentor.location
    return null
  }

  const activeFiltersCount =
    filters.skills.length +
    filters.languages.length +
    filters.locations.length +
    (filters.availability !== "all" ? 1 : 0) +
    (filters.verified ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-primary">Encontre seu Mentor Ideal</h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Conecte-se com mentores voluntários experientes e acelere seu crescimento profissional
            </p>

            {/* Search Bar */}
            <div className="flex gap-4 max-w-2xl mx-auto mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, especialidade, empresa..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-12 px-6 relative">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-accent">{activeFiltersCount}</Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="w-80 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Filtros</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Limpar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Availability Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Disponibilidade</Label>
                      <Select
                        value={filters.availability}
                        onValueChange={(value) => handleFilterChange("availability", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="busy">Ocupado</SelectItem>
                          <SelectItem value="unavailable">Indisponível</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Verified Filter */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={filters.verified}
                        onCheckedChange={(checked) => handleFilterChange("verified", checked)}
                      />
                      <Label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                        Apenas mentores verificados
                      </Label>
                    </div>

                    <Separator />

                    {/* Skills Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Especialidades</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {SKILLS_OPTIONS.map((skill) => (
                          <div key={skill} className="flex items-center space-x-2">
                            <Checkbox
                              id={`skill-${skill}`}
                              checked={filters.skills.includes(skill)}
                              onCheckedChange={() => handleSkillToggle(skill)}
                            />
                            <Label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer">
                              {skill}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Languages Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Idiomas</Label>
                      <div className="space-y-2">
                        {LANGUAGES_OPTIONS.map((language) => (
                          <div key={language} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lang-${language}`}
                              checked={filters.languages.includes(language)}
                              onCheckedChange={() => handleLanguageToggle(language)}
                            />
                            <Label htmlFor={`lang-${language}`} className="text-sm cursor-pointer">
                              {language}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Locations Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Localização</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {LOCATIONS_OPTIONS.map((location) => (
                          <div key={location} className="flex items-center space-x-2">
                            <Checkbox
                              id={`loc-${location}`}
                              checked={filters.locations.includes(location)}
                              onCheckedChange={() => handleLocationToggle(location)}
                            />
                            <Label htmlFor={`loc-${location}`} className="text-sm cursor-pointer">
                              {location}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  {isLoading ? "Carregando mentores..." : `${mentors?.length || 0} mentores encontrados`}
                </div>
                {!showFilters && (
                  <Button variant="outline" onClick={() => setShowFilters(true)} className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-accent">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                )}
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {filters.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleSkillToggle(skill)} />
                    </Badge>
                  ))}
                  {filters.languages.map((language) => (
                    <Badge key={language} variant="secondary" className="flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      {language}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleLanguageToggle(language)} />
                    </Badge>
                  ))}
                  {filters.locations.map((location) => (
                    <Badge key={location} variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {location}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleLocationToggle(location)} />
                    </Badge>
                  ))}
                  {filters.availability !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {filters.availability === "available"
                        ? "Disponível"
                        : filters.availability === "busy"
                          ? "Ocupado"
                          : "Indisponível"}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("availability", "all")} />
                    </Badge>
                  )}
                  {filters.verified && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verificado
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("verified", false)} />
                    </Badge>
                  )}
                </div>
              )}

              {/* Mentor Cards */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-muted rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                          <div className="flex gap-2">
                            <div className="h-6 bg-muted rounded w-16"></div>
                            <div className="h-6 bg-muted rounded w-20"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : mentors && mentors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {mentors.map((mentor) => {
                    const availabilityBadge = getAvailabilityBadge(mentor.availability)
                    const location = formatLocation(mentor)

                    return (
                      <Card
                        key={mentor.id}
                        className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <Avatar className="w-16 h-16 border-2 border-primary/10">
                                <AvatarImage src={mentor.avatar_url || "/placeholder.svg"} alt={mentor.full_name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {mentor.first_name?.[0]}
                                  {mentor.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              {mentor.verified_at && (
                                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                                  <CheckCircle className="h-3 w-3 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg text-card-foreground truncate">
                                {mentor.full_name}
                              </CardTitle>
                              {mentor.current_position && (
                                <CardDescription className="flex items-center gap-1 mt-1">
                                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {mentor.current_position}
                                    {mentor.current_company && ` • ${mentor.current_company}`}
                                  </span>
                                </CardDescription>
                              )}
                              {location && (
                                <CardDescription className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{location}</span>
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {mentor.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{mentor.bio}</p>
                          )}

                          {/* Skills */}
                          {mentor.mentor_skills && mentor.mentor_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {mentor.mentor_skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {mentor.mentor_skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{mentor.mentor_skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Stats and Availability */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              {mentor.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{mentor.rating.toFixed(1)}</span>
                                </div>
                              )}
                              {mentor.total_sessions && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>{mentor.total_sessions}</span>
                                </div>
                              )}
                            </div>
                            <Badge variant={availabilityBadge.variant} className={`${availabilityBadge.color} text-xs`}>
                              {availabilityBadge.text}
                            </Badge>
                          </div>

                          {/* Languages */}
                          {mentor.languages && mentor.languages.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Languages className="h-4 w-4" />
                              <span className="truncate">
                                {mentor.languages.slice(0, 2).join(", ")}
                                {mentor.languages.length > 2 && ` +${mentor.languages.length - 2}`}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {isAuthenticated ? (
                              <>
                                <Button asChild className="flex-1" size="sm">
                                  <Link href={`/mentors/${mentor.id}`}>Ver Perfil</Link>
                                </Button>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  disabled={mentor.availability !== "available"}
                                >
                                  <Link href={`/mentors/${mentor.id}/schedule`}>
                                    <Calendar className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                                <Link href="/login">Fazer login para conectar</Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-6 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhum mentor encontrado</h3>
                    <p className="mb-6 max-w-md mx-auto">
                      Não encontramos mentores que correspondam aos seus critérios de busca. Tente ajustar os filtros ou
                      termos de busca.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" onClick={clearFilters}>
                        Limpar todos os filtros
                      </Button>
                      <Button asChild>
                        <Link href="/signup">Torne-se um mentor</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MentorsPage() {
  const router = useRouter()
  const estamosLotados = false

  return (
    <div className="relative">
      <div className={estamosLotados ? "blur-sm pointer-events-none" : ""}>
        <Suspense fallback={<div>Carregando...</div>}>
          <MentorsContent />
        </Suspense>
      </div>
      {estamosLotados && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <WaitingList isOpen={true} onClose={() => router.push("/")} />
        </div>
      )}
    </div>
  )
}
