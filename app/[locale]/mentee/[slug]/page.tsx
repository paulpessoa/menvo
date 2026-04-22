import { Metadata } from 'next'
import { createClient } from '@/lib/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MenteeProfileClient from './MenteeProfileClient'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

// Interface idêntica à esperada pelo MenteeProfileClient
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

async function getMenteeData(slug: string, currentUserId: string) {
    const supabase = await createClient()

    // Buscar perfil do mentee pelo slug
    const { data: mentee, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .returns<MenteeProfile>()
        .single()

    if (error || !mentee) {
        return null
    }

    // Verificar se o usuário atual é mentor
    let isMentor = false

    const { data: mentorData } = await supabase
        .from('mentors')
        .select('id')
        .eq('id', currentUserId)
        .maybeSingle()

    if (mentorData) {
        isMentor = true
    } else {
        const { data: mentorView } = await supabase
            .from('mentors_view')
            .select('id')
            .eq('id', currentUserId)
            .maybeSingle()

        isMentor = !!mentorView
    }

    return {
        mentee,
        isMentor
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return {
            title: 'Perfil do Mentee | Menvo',
        }
    }

    const data = await getMenteeData(slug, user.id)

    if (!data) {
        return {
            title: 'Mentee não encontrado | Menvo',
        }
    }

    const { mentee } = data
    const fullName = `${mentee.first_name} ${mentee.last_name}`.trim()

    return {
        title: `${fullName} - Perfil | Menvo`,
        description: `Perfil de ${fullName} na plataforma Menvo`,
    }
}

export default async function MenteeProfilePage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const data = await getMenteeData(slug, user.id)

    if (!data) {
        notFound()
    }

    const { mentee, isMentor } = data

    // Permitir se:
    // 1. É mentor (pode ver qualquer mentee)
    // 2. É o próprio perfil
    // 3. O perfil é público
    const isOwner = user.id === mentee.id;
    const canView = isMentor || isOwner || mentee.is_public;

    if (!canView) {
        redirect('/unauthorized')
    }

    return <MenteeProfileClient mentee={mentee} />
}
