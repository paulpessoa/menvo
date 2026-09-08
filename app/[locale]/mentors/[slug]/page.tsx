import { Metadata } from "next"
import { notFound } from "next/navigation"
import MentorProfileClient, { type MentorProfile } from "./MentorProfileClient"
import { mentorPublicService } from "@/lib/services/mentors/mentor-public.service"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Metadados dinâmicos para SEO e Open Graph
export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await mentorPublicService.getMentorBySlugOrId(slug)

  if (!data) {
    return {
      title: "Mentor não encontrado | Menvo",
      description: "O mentor que você procura não está disponível."
    }
  }

  const { mentor } = data
  const title = `${mentor.full_name} - ${mentor.job_title || "Mentor"} | Menvo`
  const description =
    mentor.bio?.substring(0, 160) ||
    `Conecte-se com ${mentor.full_name}, mentor especializado em ${mentor.mentorship_topics?.slice(0, 3).join(", ") || "diversas áreas"}. Mentorias 100% gratuitas.`

  const imageUrl =
    mentor.avatar_url || `${process.env.NEXT_PUBLIC_SITE_URL}/og-default.png`
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/mentors/${slug}`

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      images: [
        { url: imageUrl, width: 1200, height: 630, alt: mentor.full_name || title }
      ],
      siteName: "Menvo",
      locale: "pt_BR"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    },
    alternates: {
      canonical: url
    }
  }
}

// ISR: Revalidar a cada 1 hora
export const revalidate = 3600

export default async function MentorProfilePage({ params }: PageProps) {
  const { slug } = await params
  const data = await mentorPublicService.getMentorBySlugOrId(slug)

  if (!data) {
    notFound()
  }

  const { mentor, availability } = data

  // Mapear campos da view para o formato esperado pelo componente
  const mappedMentor: MentorProfile = {
    id: mentor.id || "",
    full_name: mentor.full_name || `${mentor.first_name || ""} ${mentor.last_name || ""}`.trim(),
    avatar_url: mentor.avatar_url,
    bio: mentor.bio,
    job_title: mentor.job_title,
    company: mentor.company,
    city: mentor.city,
    state: mentor.state,
    country: mentor.country,
    languages: mentor.languages,
    mentorship_topics: mentor.mentorship_topics,
    inclusive_tags: mentor.inclusive_tags,
    expertise_areas: mentor.expertise_areas,
    availability_status: mentor.availability_status || "available",
    average_rating: mentor.average_rating || 0,
    total_reviews: mentor.total_reviews || 0,
    total_sessions: mentor.total_sessions || 0,
    chat_enabled: !!mentor.chat_enabled,
    experience_years: mentor.experience_years,
    linkedin_url: mentor.linkedin_url,
    github_url: mentor.github_url,
    twitter_url: mentor.twitter_url,
    website_url: mentor.website_url,
    timezone: mentor.timezone,
    slug: mentor.slug,
    created_at: mentor.created_at || undefined
  }

  return (
    <MentorProfileClient
      mentor={mappedMentor}
      availability={availability}
    />
  )
}
