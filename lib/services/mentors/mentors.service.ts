import { supabase } from "@/lib/services/auth/auth.service"
import type { Database } from "@/lib/types/supabase"
import type {
  MentorProfile,
  MentorFilters,
  PaginatedMentors
} from "@/lib/types/models/mentor"

export type { MentorProfile, MentorFilters, PaginatedMentors }

export interface FilterOptions {
  topics: string[]
  languages: string[]
  educationLevels: string[]
  cities: string[]
  countries: string[]
  inclusionTags: string[]
  experienceRanges: { label: string; min: number; max: number }[]
}

type MentorViewRow = Database["public"]["Views"]["mentors_view"]["Row"]

class MentorService {
  async getMentors(filters: MentorFilters = {}): Promise<PaginatedMentors> {
    const {
      search,
      topics = [],
      languages = [],
      inclusionTags = [],
      experienceYears = [],
      educationLevels = [],
      city,
      country,
      availability_status,
      page = 1,
      limit = 12
    } = filters

    let query = supabase
      .from("mentors_view")
      .select(
        `
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        job_title,
        company,
        location,
        availability_status,
        inclusive_tags,
        experience_years,
        mentor_skills,
        languages,
        academic_level,
        active_roles,
        average_rating,
        total_sessions,
        total_reviews
      `,
        { count: "exact" }
      )
      .contains("active_roles", ["mentor"])
      .not("mentor_skills", "is", null)

    // Filtro de busca genérica
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,` +
          `last_name.ilike.%${search}%,` +
          `bio.ilike.%${search}%,` +
          `job_title.ilike.%${search}%,` +
          `company.ilike.%${search}%,` +
          `mentor_skills.cs.{${search}}`
      )
    }

    // Filtro por tópicos/skills
    if (topics.length > 0) {
      query = query.overlaps("mentor_skills", topics)
    }

    // Filtro por idiomas
    if (languages.length > 0) {
      query = query.overlaps("languages", languages)
    }

    // Filtro por Inclusion Tags
    if (inclusionTags.length > 0) {
      query = query.overlaps("inclusive_tags", inclusionTags)
    }

    // Filtro por anos de experiência
    if (experienceYears.length === 2) {
      query = query
        .gte("experience_years", experienceYears[0])
        .lte("experience_years", experienceYears[1])
    }

    // Filtro por nível de educação
    if (educationLevels.length > 0) {
      query = query.in("academic_level", educationLevels)
    }

    // Filtro por localização
    if (city) {
      query = query.ilike("location", `%${city}%`)
    }
    if (country) {
      query = query.ilike("location", `%${country}%`)
    }

    // Filtro por disponibilidade
    if (availability_status && availability_status !== "all") {
      query = query.eq("availability_status", availability_status)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Ordenação
    query = query.order("first_name", { ascending: true })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar mentores: ${error.message}`)
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    const mentors: MentorProfile[] = ((data as unknown as MentorViewRow[]) || []).map((row) => ({
      id: row.id || "",
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      bio: row.bio,
      job_title: row.job_title,
      company: row.company,
      location: row.location,
      availability_status: (row.availability_status as MentorProfile["availability_status"]) || null,
      availability: null,
      experience_years: row.experience_years,
      mentor_skills: row.mentor_skills,
      languages: row.languages,
      academic_level: row.academic_level,
      inclusion_tags: row.inclusive_tags,
      inclusive_tags: row.inclusive_tags,
      average_rating: row.average_rating || 0,
      total_sessions: row.total_sessions || 0,
      total_reviews: row.total_reviews || 0
    }))

    return {
      mentors,
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
      .from("mentors_view")
      .select("mentor_skills")
      .contains("active_roles", ["mentor"])

    if (skillsError) {
      throw new Error(`Erro ao buscar skills: ${skillsError.message}`)
    }

    // Buscar todos os idiomas únicos
    const { data: languagesData, error: languagesError } = await supabase
      .from("mentors_view")
      .select("languages")
      .contains("active_roles", ["mentor"])

    if (languagesError) {
      throw new Error(`Erro ao buscar idiomas: ${languagesError.message}`)
    }

    // Buscar todas as Tags Inclusivas
    const { data: inclusionTagsData, error: inclusionTagsError } = await supabase
      .from("mentors_view")
      .select("inclusive_tags")
      .contains("active_roles", ["mentor"])

    if (inclusionTagsError) {
      throw new Error(
        `Erro ao buscar Tags Inclusivas: ${inclusionTagsError.message}`
      )
    }

    // Buscar localizações únicas
    const { data: locationsData, error: locationsError } = await supabase
      .from("mentors_view")
      .select("location")
      .contains("active_roles", ["mentor"])
      .not("location", "is", null)

    if (locationsError) {
      throw new Error(`Erro ao buscar localizações: ${locationsError.message}`)
    }

    // Processar dados
    const allSkills =
      (skillsData as { mentor_skills: string[] | null }[])?.flatMap((item) => item.mentor_skills || []) || []
    const uniqueTopics = Array.from(new Set(allSkills))
      .filter(Boolean)
      .sort() as string[]

    const allLanguages =
      (languagesData as { languages: string[] | null }[])?.flatMap((item) => item.languages || []) || []
    const uniqueLanguages = Array.from(new Set(allLanguages))
      .filter(Boolean)
      .sort() as string[]

    const allInclusionTags =
      (inclusionTagsData as { inclusive_tags: string[] | null }[])?.flatMap(
        (item) => item.inclusive_tags || []
      ) || []
    const uniqueInclusionTags = Array.from(new Set(allInclusionTags))
      .filter(Boolean)
      .sort() as string[]

    const allLocations =
      (locationsData as { location: string | null }[])?.map((item) => item.location).filter(Boolean) || []
    const cities: string[] = []
    const countries: string[] = []

    allLocations.forEach((location) => {
      if (location) {
        const parts = location.split(",").map((part: string) => part.trim())
        if (parts.length >= 2) {
          cities.push(parts[0])
          countries.push(parts[parts.length - 1])
        }
      }
    })

    const uniqueCities = Array.from(new Set(cities)).sort()
    const uniqueCountries = Array.from(new Set(countries)).sort()

    return {
      topics: uniqueTopics,
      inclusionTags: uniqueInclusionTags,
      languages: uniqueLanguages,
      educationLevels: [
        "Ensino Fundamental",
        "Ensino Médio",
        "Técnico",
        "Superior",
        "Pós-graduação",
        "Mestrado",
        "MBA",
        "Doutorado",
        "Pós-doutorado"
      ],
      cities: uniqueCities,
      countries: uniqueCountries,
      experienceRanges: [
        { label: "Iniciante (0-2 anos)", min: 0, max: 2 },
        { label: "Júnior (3-5 anos)", min: 3, max: 5 },
        { label: "Pleno (6-10 anos)", min: 6, max: 10 },
        { label: "Sênior (11-15 anos)", min: 11, max: 15 },
        { label: "Especialista (16+ anos)", min: 16, max: 50 }
      ]
    }
  }

  async getMentorById(id: string): Promise<MentorProfile | null> {
    const { data, error } = await supabase
      .from("mentors_view")
      .select(
        `
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        job_title,
        company,
        location,
        availability_status,
        experience_years,
        mentor_skills,
        languages,
        academic_level,
        active_roles,
        inclusive_tags,
        average_rating,
        total_sessions,
        total_reviews
      `
      )
      .eq("id", id)
      .contains("active_roles", ["mentor"])
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar mentor: ${error.message}`)
    }

    if (!data) return null

    const row = data as unknown as MentorViewRow

    return {
      id: row.id || id,
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      bio: row.bio,
      job_title: row.job_title,
      company: row.company,
      location: row.location,
      availability_status: (row.availability_status as MentorProfile["availability_status"]) || null,
      availability: null,
      experience_years: row.experience_years,
      mentor_skills: row.mentor_skills,
      languages: row.languages,
      academic_level: row.academic_level,
      inclusion_tags: row.inclusive_tags,
      inclusive_tags: row.inclusive_tags,
      average_rating: row.average_rating || 0,
      total_sessions: row.total_sessions || 0,
      total_reviews: row.total_reviews || 0
    }
  }
}

export const mentorService = new MentorService()
