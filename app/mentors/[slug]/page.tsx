"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    MapPin,
    Star,
    Clock,
    DollarSign,
    Users,
    Globe,
    Briefcase,
    Calendar,
    MessageCircle,
    ExternalLink,
    ArrowLeft,
    Languages,
    Award,
    Heart,
    Share2,
    Loader2
} from "lucide-react"
import Link from "next/link"
import AvailabilityDisplay from "@/components/mentorship/AvailabilityDisplay"

interface MentorProfile {
    id: string
    full_name: string
    avatar_url: string | null
    bio: string | null
    job_title: string | null
    company: string | null
    city: string | null
    state: string | null
    country: string | null
    languages: string[] | null
    mentorship_topics: string[] | null
    inclusive_tags: string[] | null
    expertise_areas: string[] | null
    session_price_usd: number | null
    availability_status: string
    average_rating: number
    total_reviews: number
    total_sessions: number
    experience_years: number | null
    linkedin_url: string | null
    github_url: string | null
    twitter_url: string | null
    website_url: string | null
    timezone: string | null
    slug: string | null
}

interface MentorAvailability {
    day_of_week: number
    start_time: string
    end_time: string
    timezone: string
}

export default function MentorProfilePage() {
    const params = useParams()
    const router = useRouter()
    const [mentor, setMentor] = useState<MentorProfile | null>(null)
    const [availability, setAvailability] = useState<MentorAvailability[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (params.slug) {
            fetchMentorProfile(params.slug as string)
        }
    }, [params.slug])

    const fetchMentorProfile = async (slug: string) => {
        try {
            setLoading(true)

            // Fetch mentor profile
            const { data: mentorData, error: mentorError } = await supabase
                .from('profiles')
                .select(`
          id,
          full_name,
          avatar_url,
          bio,
          job_title,
          company,
          city,
          state,
          country,
          languages,
          mentorship_topics,
          inclusive_tags,
          expertise_areas,
          session_price_usd,
          availability_status,
          average_rating,
          total_reviews,
          total_sessions,
          experience_years,
          linkedin_url,
          github_url,
          twitter_url,
          website_url,
          timezone,
          slug,
          user_roles!inner(
            roles!inner(name)
          )
        `)
                .eq('slug', slug)
                .eq('verified', true)
                .eq('user_roles.roles.name', 'mentor')
                .single()

            if (mentorError) {
                if (mentorError.code === 'PGRST116') {
                    setError('Mentor não encontrado')
                } else {
                    throw mentorError
                }
                return
            }

            setMentor(mentorData)

            // Fetch availability
            const { data: availabilityData, error: availabilityError } = await supabase
                .from('mentor_availability')
                .select('*')
                .eq('mentor_id', mentorData.id)
                .order('day_of_week')

            if (availabilityError) {
                console.error('Error fetching availability:', availabilityError)
            } else {
                setAvailability(availabilityData || [])
            }

        } catch (error) {
            console.error('Error fetching mentor profile:', error)
            setError('Erro ao carregar perfil do mentor')
        } finally {
            setLoading(false)
        }
    }

    const getAvailabilityColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 border-green-200'
            case 'busy': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'unavailable': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getAvailabilityText = (status: string) => {
        switch (status) {
            case 'available': return 'Disponível'
            case 'busy': return 'Ocupado'
            case 'unavailable': return 'Indisponível'
            default: return 'Status desconhecido'
        }
    }

    const getDayName = (dayOfWeek: number) => {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        return days[dayOfWeek]
    }

    const formatTime = (time: string) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Carregando perfil do mentor...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !mentor) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {error || 'Mentor não encontrado'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        O mentor que você está procurando não existe ou não está mais disponível.
                    </p>
                    <Button asChild>
                        <Link href="/mentors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para Mentores
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/mentors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Mentores
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Profile */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={mentor.avatar_url || undefined} />
                                        <AvatarFallback className="text-lg">
                                            {mentor.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-2xl">{mentor.full_name}</CardTitle>
                                        <CardDescription className="text-lg">
                                            {mentor.job_title}
                                            {mentor.company && ` @ ${mentor.company}`}
                                        </CardDescription>
                                        {(mentor.city || mentor.country) && (
                                            <div className="flex items-center text-gray-500 mt-1">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                {[mentor.city, mentor.state, mentor.country].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="icon">
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Status and Stats */}
                            <div className="flex items-center justify-between pt-4">
                                <Badge className={getAvailabilityColor(mentor.availability_status)}>
                                    {getAvailabilityText(mentor.availability_status)}
                                </Badge>

                                <div className="flex items-center space-x-6 text-sm text-gray-600">
                                    {mentor.average_rating > 0 && (
                                        <div className="flex items-center">
                                            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                                            <span className="font-medium">{mentor.average_rating.toFixed(1)}</span>
                                            <span className="ml-1">({mentor.total_reviews} avaliações)</span>
                                        </div>
                                    )}

                                    {mentor.total_sessions > 0 && (
                                        <div className="flex items-center">
                                            <MessageCircle className="h-4 w-4 mr-1" />
                                            <span>{mentor.total_sessions} sessões</span>
                                        </div>
                                    )}

                                    {mentor.experience_years && (
                                        <div className="flex items-center">
                                            <Briefcase className="h-4 w-4 mr-1" />
                                            <span>{mentor.experience_years} anos de experiência</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Bio */}
                    {mentor.bio && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sobre</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">{mentor.bio}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Topics and Expertise */}
                    {(mentor.mentorship_topics?.length || mentor.expertise_areas?.length) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Especialidades</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Temas de Mentoria</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.mentorship_topics.map((topic, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Áreas de Expertise</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.expertise_areas.map((area, index) => (
                                                <Badge key={index} variant="outline">
                                                    {area}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Languages and Inclusive Tags */}
                    {(mentor.languages?.length || mentor.inclusive_tags?.length) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Idiomas e Inclusão</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {mentor.languages && mentor.languages.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2 flex items-center">
                                            <Languages className="h-4 w-4 mr-2" />
                                            Idiomas
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.languages.map((language, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {language}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mentor.inclusive_tags && mentor.inclusive_tags.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2 flex items-center">
                                            <Award className="h-4 w-4 mr-2" />
                                            Tags Inclusivas
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.inclusive_tags.map((tag, index) => (
                                                <Badge key={index} className="bg-purple-100 text-purple-800 border-purple-200">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Booking Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Agendar Sessão
                                {mentor.session_price_usd && (
                                    <div className="flex items-center text-green-600 font-bold">
                                        <DollarSign className="h-4 w-4" />
                                        <span>{mentor.session_price_usd}</span>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full" size="lg">
                                <Calendar className="h-4 w-4 mr-2" />
                                Agendar Mentoria
                            </Button>
                            <Button variant="outline" className="w-full">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Enviar Mensagem
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Availability */}
                    <AvailabilityDisplay
                        mentorId={mentor.id}
                        availability={availability}
                        timezone={mentor.timezone || 'America/Sao_Paulo'}
                        showBookingButtons={true}
                        onBookSlot={(slot) => {
                            // TODO: Implement booking logic
                            console.log('Book slot:', slot)
                        }}
                        compact={true}
                    />

                    {/* Social Links */}
                    {(mentor.linkedin_url || mentor.github_url || mentor.twitter_url || mentor.website_url) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Globe className="h-4 w-4 mr-2" />
                                    Links
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {mentor.linkedin_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                                {mentor.github_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentor.github_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            GitHub
                                        </a>
                                    </Button>
                                )}
                                {mentor.twitter_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentor.twitter_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Twitter
                                        </a>
                                    </Button>
                                )}
                                {mentor.website_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentor.website_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Website
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}