import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MenteeProfileClient from './MenteeProfileClient'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

async function getMenteeData(slug: string, currentUserId: string) {
    const supabase = await createClient()

    // Buscar perfil do mentee pelo slug
    const { data: mentee, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !mentee) {
        return null
    }

    // Verificar se o usuário atual é mentor
    // Primeiro tentar na tabela mentors
    let isMentor = false

    const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('id')
        .eq('id', currentUserId)
        .maybeSingle()

    console.log('[MENTEE PROFILE] Checking mentors table:', { mentorData, mentorError })

    if (mentorData) {
        isMentor = true
    } else {
        // Se não encontrou, tentar na view mentors_view
        const { data: mentorView } = await supabase
            .from('mentors_view')
            .select('id')
            .eq('id', currentUserId)
            .maybeSingle()

        console.log('[MENTEE PROFILE] Checking mentors_view:', { mentorView })
        isMentor = !!mentorView
    }

    console.log('[MENTEE PROFILE] Final result - User:', currentUserId, 'Mentee slug:', slug, 'Is Mentor:', isMentor)

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
    const canView = isMentor || user.id === mentee.id;

    if (!canView) {
        redirect('/unauthorized')
    }

    return <MenteeProfileClient mentee={mentee} />
}
