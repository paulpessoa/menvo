import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import MentorProfileClient from './MentorProfileClient'

interface PageProps {
    params: {
        slug: string
    }
}

// Buscar dados do mentor e disponibilidade
async function getMentorData(slug: string) {
    const supabase = await createClient()

    // Buscar mentor
    const { data: mentor, error } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('slug', slug)
        .eq('verified', true)
        .single()

    if (error || !mentor) {
        return null
    }

    // Buscar disponibilidade via API (usa Service Role, bypass RLS)
    let availability = []
    try {
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mentors/${mentor.id}/availability`
        const response = await fetch(apiUrl, { cache: 'no-store' })
        if (response.ok) {
            availability = await response.json()
        }
    } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error)
    }

    return {
        mentor,
        availability: availability || []
    }
}

// Metadados dinâmicos para SEO e Open Graph
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = await getMentorData(params.slug)

    if (!data) {
        return {
            title: 'Mentor não encontrado | Menvo',
            description: 'O mentor que você procura não está disponível.',
        }
    }

    const { mentor } = data
    const title = `${mentor.full_name} - ${mentor.current_position || 'Mentor'} | Menvo`
    const description = mentor.bio?.substring(0, 160) ||
        `Conecte-se com ${mentor.full_name}, mentor especializado em ${mentor.mentorship_topics?.slice(0, 3).join(', ') || 'diversas áreas'}. Mentorias 100% gratuitas.`

    const imageUrl = mentor.avatar_url || `${process.env.NEXT_PUBLIC_SITE_URL}/og-default.png`
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/mentors/${params.slug}`

    return {
        title,
        description,
        openGraph: {
            type: 'profile',
            url,
            title,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630, alt: mentor.full_name }],
            siteName: 'Menvo',
            locale: 'pt_BR',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        alternates: {
            canonical: url,
        },
    }
}

// ISR: Revalidar a cada 1 hora
export const revalidate = 3600

export default async function MentorProfilePage({ params }: PageProps) {
    const data = await getMentorData(params.slug)

    if (!data) {
        notFound()
    }

    const { mentor, availability } = data

    // Mapear campos da view para o formato esperado pelo componente
    const mappedMentor = {
        ...mentor,
        job_title: mentor.current_position,
        company: mentor.current_company,
        inclusive_tags: mentor.inclusion_tags,
        average_rating: mentor.rating,
        total_reviews: mentor.reviews,
        total_sessions: mentor.sessions,
    }

    return (
        <MentorProfileClient
            mentor={mappedMentor}
            availability={availability}
        />
    )
}
