"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination"
import { Search, SlidersHorizontal, Star, MapPin, Briefcase, Languages, ArrowRight, Loader2 } from 'lucide-react'
import MentorFilters from "@/components/mentor-filters"
import { useMentors } from "@/hooks/useMentors"
import { MentorProfile } from "@/services/mentors/mentors"
import { useTranslation } from "react-i18next"
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MentorsPage() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    topics: [],
    languages: [],
    experienceYears: [],
    educationLevels: [],
    rating: undefined,
    city: "",
    country: "",
    state_province: "",
    inclusionTags: [],
  })
  const [sortBy, setSortBy] = useState("name-asc")
  const [currentPage, setCurrentPage] = useState(1)
  const mentorsPerPage = 12

  const { data, isLoading, error } = useMentors({
    search: searchTerm,
    topics: filters.topics,
    languages: filters.languages,
    experienceYears: filters.experienceYears,
    educationLevels: filters.educationLevels,
    rating: filters.rating,
    city: filters.city,
    country: filters.country,
    state_province: filters.state_province,
    inclusionTags: filters.inclusionTags,
    page: currentPage,
    limit: mentorsPerPage,
    sortBy: sortBy,
  })

  const mentors = data?.mentors || []
  const totalPages = data?.totalPages || 1

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleClearFilters = () => {
    setFilters({
      topics: [],
      languages: [],
      experienceYears: [],
      educationLevels: [],
      rating: undefined,
      city: "",
      country: "",
      state_province: "",
      inclusionTags: [],
    })
    setSearchTerm("")
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando mentores...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8 text-center text-red-500">
        <p>Erro ao carregar mentores: {error.message}</p>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <section className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {t('mentors.hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('mentors.hero.description')}
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <MentorFilters filters={filters} onFiltersChange={handleFilterChange} onClearFilters={handleClearFilters} />
          </div>

          {/* Mentor List */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('mentors.searchPlaceholder')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('mentors.sortBy')}:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('mentors.sortByPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">{t('mentors.sortOptions.nameAsc')}</SelectItem>
                    <SelectItem value="name-desc">{t('mentors.sortOptions.nameDesc')}</SelectItem>
                    <SelectItem value="experience-desc">{t('mentors.sortOptions.experienceDesc')}</SelectItem>
                    <SelectItem value="rating-desc">{t('mentors.sortOptions.ratingDesc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mentors.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">
                  {t('mentors.noMentorsFound.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('mentors.noMentorsFound.description')}
                </p>
                <Button onClick={handleClearFilters} className="mt-6">
                  {t('mentors.noMentorsFound.clearFilters')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor: MentorProfile) => (
                  <Card key={mentor.id} className="flex flex-col">
                    <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4 border-2 border-primary/20 bg-muted">
                        {mentor.avatar_url ? (
                          <Image
                            src={mentor.avatar_url || "/placeholder.svg"}
                            alt={`${mentor.first_name} ${mentor.last_name}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        {mentor.first_name} {mentor.last_name}
                      </h3>
                      {mentor.current_position && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {mentor.current_position}
                          {mentor.current_company && ` at ${mentor.current_company}`}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        {mentor.rating > 0 && (
                          <>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>{mentor.rating.toFixed(1)} ({mentor.total_sessions} sessões)</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {mentor.mentor_skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {mentor.mentor_skills.length > 3 && (
                          <Badge variant="outline">
                            +{mentor.mentor_skills.length - 3}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {mentor.bio || t('mentors.noBio')}
                      </p>
                      <Link href={`/mentors/${mentor.id}`} passHref className="mt-auto w-full">
                        <Button variant="outline" className="w-full">
                          {t('mentors.viewProfile')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
