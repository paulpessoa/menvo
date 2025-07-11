import { supabase } from '@/services/auth/supabase'

export interface MentorFilters {
  search?: string
  topics?: string[]
  languages?: string[]
  inclusionTags?: string[]
  experienceYears?: number[]
  educationLevels?: string[]
  rating?: number
  city?: string
  country?: string
  availability?: string
  page?: number
  limit?: number
  sortBy?: string
}

export interface MentorProfile {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
  bio?: string
  current_position?: string
  current_company?: string
  location?: string
  availability: 'available' | 'busy'
  years_experience?: number
  rating?: number
  total_sessions?: number
  mentor_skills: string[]
  languages: string[]
  education_level?: string
  verified_at?: string
}

export interface PaginatedMentors {
  mentors: MentorProfile[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface FilterOptions {
  topics: string[]
  languages: string[]
  educationLevels: string[]
  cities: string[]
  countries: string[],
  inclusionTags: string[]
  experienceRanges: { label: string, min: number, max: number }[]
}

class MentorService {
  async getMentors(filters: MentorFilters = {}): Promise<PaginatedMentors> {
    const {
      search,
      topics = [],
      languages = [],
      inclusionTags = [],
      experienceYears = [],
      educationLevels = [],
      rating = 3,
      city,
      country,
      availability,
      page = 1,
      limit = 12
    } = filters

    let query = supabase
      .from('mentors_view')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        current_position,
        current_company,
        location,
        availability,
        inclusion_tags,
        years_experience,
        mentor_skills,
        languages,
        education_level,
        active_roles
      `, { count: 'exact' })
      .contains('active_roles', ['mentor'])
      .not('mentor_skills', 'is', null)


    // Filtro de busca genérica
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,` +
        `last_name.ilike.%${search}%,` +
        `bio.ilike.%${search}%,` +
        `current_position.ilike.%${search}%,` +
        `current_company.ilike.%${search}%,` +
        `mentor_skills.cs.{${search}}`
      )
    }

    // Filtro por tópicos/skills
    if (topics.length > 0) {
      query = query.overlaps('mentor_skills', topics)
    }

    // Filtro por idiomas
    if (languages.length > 0) {
      query = query.overlaps('languages', languages)
    }
    
    // Filtro por Inclusion Tags
    if (inclusionTags.length > 0) {
      query = query.overlaps('inclusion_tags', inclusionTags)
    }

    // Filtro por anos de experiência
    if (experienceYears.length === 2) {
      query = query
        .gte('years_experience', experienceYears[0])
        .lte('years_experience', experienceYears[1])
    }

    // Filtro por nível de educação
    if (educationLevels.length > 0) {
      query = query.in('education_level', educationLevels)
    }

    // Filtro por localização
    if (city) {
      query = query.ilike('location', `%${city}%`)
    }
    if (country) {
      query = query.ilike('location', `%${country}%`)
    }

    // Filtro por disponibilidade
    if (availability && availability !== 'all') {
      query = query.eq('availability', availability)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Ordenação
    query = query.order('first_name', { ascending: true })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar mentores: ${error.message}`)
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      mentors: data || [],
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }

  async getFilterOptions(): Promise<FilterOptions> {
    // Buscar todas as skills únicas dos mentores
    const { data: skillsData, error: skillsError } = await supabase
      .from('mentors_view')
      .select('mentor_skills')
      .contains('active_roles', ['mentor'])

    if (skillsError) {
      throw new Error(`Erro ao buscar skills: ${skillsError.message}`)
    }

    // Buscar todos os idiomas únicos
    const { data: languagesData, error: languagesError } = await supabase
      .from('mentors_view')
      .select('languages')
      .contains('active_roles', ['mentor'])

    if (languagesError) {
      throw new Error(`Erro ao buscar idiomas: ${languagesError.message}`)
    }

    // Buscar todos as Tags Inclusivas
    const { data: inclusionTagsData, error: inclusionTagsError } = await supabase
      .from('mentors_view')
      .select('inclusion_tags')
      .contains('active_roles', ['mentor'])

    if (inclusionTagsError) {
      throw new Error(`Erro ao buscar Tags Inclusivas: ${inclusionTagsError.message}`)
    }

    // Buscar localizações únicas
    const { data: locationsData, error: locationsError } = await supabase
      .from('mentors_view')
      .select('location')
      .contains('active_roles', ['mentor'])
      .not('location', 'is', null)

    if (locationsError) {
      throw new Error(`Erro ao buscar localizações: ${locationsError.message}`)
    }

    // Processar dados
    const allSkills = skillsData?.flatMap(item => item.mentor_skills || []) || []
    const uniqueTopics = Array.from(new Set(allSkills))
      .filter(Boolean)
      .sort()

    const allLanguages = languagesData?.flatMap(item => item.languages || []) || []
    const uniqueLanguages = Array.from(new Set(allLanguages))
      .filter(Boolean)
      .sort()
   
    const allinclusionTags = inclusionTagsData?.flatMap(item => item.inclusion_tags || []) || []
    const uniqueInclusionTags = Array.from(new Set(allinclusionTags))
      .filter(Boolean)
      .sort()

    const allLocations = locationsData?.map(item => item.location).filter(Boolean) || []
    const cities: string[] = []
    const countries: string[] = []
    
    allLocations.forEach(location => {
      const parts = location.split(',').map((part: string) => part.trim())
      if (parts.length >= 2) {
        cities.push(parts[0])
        countries.push(parts[parts.length - 1])
      }
    })

    const uniqueCities = Array.from(new Set(cities)).sort()
    const uniqueCountries = Array.from(new Set(countries)).sort()

    return {
      topics: uniqueTopics,
      inclusionTags: uniqueInclusionTags,
      languages: uniqueLanguages,
      educationLevels: [
        'Ensino Fundamental',
        'Ensino Médio',
        'Técnico',
        'Superior',
        'Pós-graduação',
        'Mestrado',
        'MBA',
        'Doutorado',
        'Pós-doutorado'
      ],
      cities: uniqueCities,
      countries: uniqueCountries,
      experienceRanges: [
        { label: 'Iniciante (0-2 anos)', min: 0, max: 2 },
        { label: 'Júnior (3-5 anos)', min: 3, max: 5 },
        { label: 'Pleno (6-10 anos)', min: 6, max: 10 },
        { label: 'Sênior (11-15 anos)', min: 11, max: 15 },
        { label: 'Especialista (16+ anos)', min: 16, max: 50 }
      ]
    }
  }

  async getMentorById(id: string): Promise<MentorProfile | null> {
    const { data, error } = await supabase
      .from('mentors_view')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        current_position,
        current_company,
        location,
        availability,
        years_experience,
        mentor_skills,
        languages,
        education_level,
        active_roles
      `)
      .eq('id', id)
      .contains('active_roles', ['mentor'])
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Mentor não encontrado
      }
      throw new Error(`Erro ao buscar mentor: ${error.message}`)
    }

    return data
  }
}

export const mentorService = new MentorService()
