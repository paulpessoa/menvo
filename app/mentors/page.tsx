'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, SearchIcon, MapPinIcon, BriefcaseIcon, StarIcon } from 'lucide-react'
import { MentorFilters } from '@/components/mentor-filters'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile, user_skill } from '@/types/database'

interface MentorProfile extends user_profile {
  skills: user_skill[];
}

async function fetchMentors(filters: any): Promise<MentorProfile[]> {
  const params = new URLSearchParams()
  if (filters.skill) params.append('skill', filters.skill)
  if (filters.location) params.append('location', filters.location)
  if (filters.language) params.append('language', filters.language)
  if (filters.minExperience) params.append('minExperience', filters.minExperience.toString())
  if (filters.maxExperience) params.append('maxExperience', filters.maxExperience.toString())

  const response = await fetch(`/api/mentors?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch mentors')
  }
  const data = await response.json()
  return data.data
}

export default function MentorsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    skill: '',
    location: '',
    language: '',
    minExperience: '',
    maxExperience: '',
  })

  const { data: mentors, isLoading, isError, error } = useQuery<MentorProfile[], Error>({
    queryKey: ['mentors', filters],
    queryFn: () => fetchMentors(filters),
  })

  const filteredMentors = useMemo(() => {
    if (!mentors) return []
    return mentors.filter(mentor =>
      mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.current_position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.skills?.some(skill => skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [mentors, searchTerm])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando mentores...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao carregar mentores</h1>
        <p className="text-lg mb-6">{error?.message || 'Ocorreu um erro inesperado.'}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Encontre seu Mentor Ideal</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters and Search */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou habilidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <MentorFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Mentor List */}
          <div className="lg:col-span-3">
            {filteredMentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMentors.map(mentor => (
                  <Card key={mentor.id} className="flex flex-col">
                    <CardHeader className="flex flex-col items-center text-center p-4 pb-2">
                      <Avatar className="h-24 w-24 mb-3 border-2 border-primary-foreground">
                        <AvatarImage src={mentor.avatar_url || '/placeholder-user.jpg'} alt={mentor.full_name || 'Mentor'} />
                        <AvatarFallback className="text-4xl">{mentor.full_name?.charAt(0) || 'M'}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl font-bold">{mentor.full_name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {mentor.current_position} {mentor.current_company && `na ${mentor.current_company}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                        {mentor.location && (
                          <>
                            <MapPinIcon className="h-4 w-4" />
                            <span>{mentor.location}</span>
                          </>
                        )}
                        {mentor.years_experience !== null && mentor.years_experience !== undefined && (
                          <>
                            <span className="mx-1">•</span>
                            <StarIcon className="h-4 w-4" />
                            <span>{mentor.years_experience} anos</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-3">
                        {mentor.bio || 'Nenhuma biografia disponível.'}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {mentor.skills?.filter(s => s.is_mentor_skill).slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill.skill_name}
                          </Badge>
                        ))}
                        {mentor.skills && mentor.skills.filter(s => s.is_mentor_skill).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{mentor.skills.filter(s => s.is_mentor_skill).length - 3}
                          </Badge>
                        )}
                      </div>
                      <Link href={`/mentors/${mentor.id}`} passHref>
                        <Button className="w-full">Ver Perfil</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">Nenhum mentor encontrado com os filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
