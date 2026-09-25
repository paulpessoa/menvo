import { Metadata } from 'next'
import { createClient } from '@/lib/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MenteeProfileClient from './MenteeProfileClient'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

interface MenteeProfile {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
    city?: string
    state?: string
    country?: string
    bio?: string
    job_title?: string
    company?: string
    institution?: string
    course?: string
    academic_level?: string
    expected_graduation?: string
    career_goals?: string
    expertise_areas?: string[]
    mentorship_topics?: string[]
    linkedin_url?: string
    github_url?: string
    portfolio_url?: string
    cv_url?: string
    languages?: string[]
    is_public: boolean
    created_at: string
}

/**
 * Fetches a mentee profile visible to anyone (is_public = true), with no auth
 * required. Used both for link-preview metadata and for public page rendering,
 * mirroring how mentorPublicService exposes mentor profiles.
 */
async function getPublicMenteeProfile(slug: string): Promise<MenteeProfile | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .maybeSingle()

    if (error || !data) {
        return null
    }

    return data as unknown as MenteeProfile
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const mentee = await getPublicMenteeProfile(slug)

    if (!mentee) {
        const title = 'Mentorado não encontrado | Menvo'
        const imageUrl = 'https://www.menvo.com.br/images/menvopeople.jpg'
        return {
            title,
            robots: { index: false, follow: false },
            openGraph: {
                type: 'website',
                title,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
                siteName: 'Menvo',
                locale: 'pt_BR'
            },
            twitter: {
                card: 'summary_large_image',
                title,
                images: [imageUrl]
            }
        }
    }

    const fullName = `${mentee.first_name} ${mentee.last_name}`.trim()
    const title = `${fullName} - Mentorado | Menvo`
    const description =
        mentee.bio?.substring(0, 160) ||
        `Conheça ${fullName} na comunidade Menvo, buscando mentoria em ${mentee.mentorship_topics?.slice(0, 3).join(", ") || "diversas áreas"}.`
    const imageUrl = mentee.avatar_url || 'https://www.menvo.com.br/images/menvopeople.jpg'
    const canonicalPath = `/mentee/${slug}`

    return {
        title,
        description,
        openGraph: {
            type: 'profile',
            url: `https://www.menvo.com.br${canonicalPath}`,
            title,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630, alt: fullName || title }],
            siteName: 'Menvo',
            locale: 'pt_BR'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl]
        },
        alternates: {
            canonical: canonicalPath,
            languages: {
                'pt-BR': `/mentee/${slug}`,
                en: `/en/mentee/${slug}`,
                es: `/es/mentee/${slug}`
            }
        }
    }
}

export default async function MenteeProfilePage({ params }: PageProps) {
    const { slug } = await params

    // Public profiles (is_public = true) are viewable and crawlable by anyone,
    // same rule the "Mural de Mentorados" community wall uses to list them.
    const publicMentee = await getPublicMenteeProfile(slug)
    if (publicMentee) {
        return <MenteeProfileClient mentee={publicMentee} />
    }

    // Not public (or not found): only the owner or a mentor may view it, so this path requires auth.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: mentee, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    if (error || !mentee) {
        notFound()
    }

    const menteeProfile = mentee as unknown as MenteeProfile
    const isOwner = user.id === menteeProfile.id

    const { data: mentorView } = await supabase
        .from('mentors_view')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
    const isMentor = !!mentorView

    if (!isOwner && !isMentor) {
        redirect('/unauthorized')
    }

    return <MenteeProfileClient mentee={menteeProfile} />
}
