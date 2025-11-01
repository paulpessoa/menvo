'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PdfViewerDialog } from '@/components/ui/pdf-viewer-dialog'
import {
    MapPin,
    Mail,
    Calendar,
    ArrowLeft,
    Briefcase,
    GraduationCap,
    Target,
    FileText,
    User,
    Languages
} from 'lucide-react'
import Link from 'next/link'

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
    current_position?: string
    current_company?: string
    education_level?: string
    career_goals?: string
    interests?: string[]
    skills?: string[]
    linkedin_url?: string
    github_url?: string
    portfolio_url?: string
    cv_url?: string
    phone?: string
    age?: number
    languages?: string[]
    expertise_areas?: string[]
    created_at: string
}

interface Props {
    mentee: MenteeProfile
}

export default function MenteeProfileClient({ mentee }: Props) {
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false)

    const fullName = `${mentee.first_name} ${mentee.last_name}`.trim()
    const initials = `${mentee.first_name?.[0] || ''}${mentee.last_name?.[0] || ''}`.toUpperCase()

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/dashboard/mentor/appointments">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Agendamentos
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Profile */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={mentee.avatar_url} />
                                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold">{fullName}</h1>
                                    {mentee.current_position && (
                                        <p className="text-lg text-muted-foreground">
                                            {mentee.current_position}
                                            {mentee.current_company && ` @ ${mentee.current_company}`}
                                        </p>
                                    )}
                                    {(mentee.city || mentee.country) && (
                                        <div className="flex items-center text-gray-500 mt-2">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {[mentee.city, mentee.state, mentee.country].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-500 mt-1">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        Membro desde {formatDate(mentee.created_at)}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Bio */}
                    {mentee.bio && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sobre</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {mentee.bio}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Career Goals */}
                    {mentee.career_goals && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Target className="h-5 w-5 mr-2" />
                                    Objetivos de Carreira
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {mentee.career_goals}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Skills & Interests */}
                    {(mentee.skills?.length || mentee.interests?.length) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Habilidades e Interesses</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {mentee.skills && mentee.skills.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Habilidades</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentee.skills.map((skill, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mentee.interests && mentee.interests.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Interesses</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentee.interests.map((interest, index) => (
                                                <Badge key={index} variant="outline">
                                                    {interest}
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
                    {/* Informações Profissionais */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Profissionais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {mentee.current_position && (
                                <div className="flex items-start gap-2 text-sm">
                                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Cargo Atual</p>
                                        <p className="text-gray-600">{mentee.current_position}</p>
                                    </div>
                                </div>
                            )}

                            {mentee.current_company && (
                                <div className="flex items-start gap-2 text-sm">
                                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Empresa</p>
                                        <p className="text-gray-600">{mentee.current_company}</p>
                                    </div>
                                </div>
                            )}

                            {mentee.education_level && (
                                <div className="flex items-start gap-2 text-sm">
                                    <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Formação</p>
                                        <p className="text-gray-600">{mentee.education_level}</p>
                                    </div>
                                </div>
                            )}

                            {(mentee.city || mentee.state || mentee.country) && (
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Localização</p>
                                        <p className="text-gray-600">
                                            {[mentee.city, mentee.state, mentee.country].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mentee.languages && mentee.languages.length > 0 && (
                                <div className="flex items-start gap-2 text-sm">
                                    <Languages className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Idiomas</p>
                                        <p className="text-gray-600">{mentee.languages.join(', ')}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Áreas de Expertise */}
                    {mentee.expertise_areas && mentee.expertise_areas.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Áreas de Interesse</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {mentee.expertise_areas.map((area, index) => (
                                        <Badge key={index} variant="outline">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Feedback e Avaliações - Em Desenvolvimento */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Avaliações de Mentores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6 text-muted-foreground">
                                <p className="text-sm italic">Em desenvolvimento</p>
                                <p className="text-xs mt-2">
                                    Em breve você poderá ver feedbacks e avaliações recebidas de mentores
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Currículo */}
                    {mentee.cv_url && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Currículo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={() => setIsPdfViewerOpen(true)}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Visualizar Currículo
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Links */}
                    {(mentee.linkedin_url || mentee.github_url || mentee.portfolio_url) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Links
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {mentee.linkedin_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentee.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                                {mentee.github_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentee.github_url} target="_blank" rel="noopener noreferrer">
                                            GitHub
                                        </a>
                                    </Button>
                                )}
                                {mentee.portfolio_url && (
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <a href={mentee.portfolio_url} target="_blank" rel="noopener noreferrer">
                                            Portfólio
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* PDF Viewer Dialog */}
            {mentee.cv_url && (
                <PdfViewerDialog
                    open={isPdfViewerOpen}
                    onOpenChange={setIsPdfViewerOpen}
                    pdfUrl={mentee.cv_url}
                    title={`Currículo - ${fullName}`}
                />
            )}
        </div>
    )
}
