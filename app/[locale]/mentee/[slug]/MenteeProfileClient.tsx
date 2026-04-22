'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    Languages,
    MessageCircle,
    Sparkles,
    BookOpen,
    Quote
} from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { useAuth } from '@/lib/auth'

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
    created_at: string
}

interface Props {
    mentee: MenteeProfile
}

export default function MenteeProfileClient({ mentee }: Props) {
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false)
    const { user, profile: currentUserProfile } = useAuth()
    const router = useRouter()
    
    const isMentor = currentUserProfile?.roles?.includes('mentor') || false
    const isOwner = user?.id === mentee.id

    const fullName = `${mentee.first_name} ${mentee.last_name}`.trim()
    const initials = `${mentee.first_name?.[0] || ''}${mentee.last_name?.[0] || ''}`.toUpperCase()

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        })
    }

    const handleChat = () => {
        // Redirecionar para o chat com o parâmetro de ID do usuário
        router.push(`/messages?userId=${mentee.id}`)
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Navigation */}
            <div className="mb-8 flex items-center justify-between">
                <Button variant="ghost" asChild className="hover:bg-transparent hover:text-primary p-0">
                    <Link href="/community">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Mural de Mentorados
                    </Link>
                </Button>
                
                {isOwner && (
                    <Button variant="outline" asChild size="sm">
                        <Link href="/profile">Editar meu Perfil</Link>
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Info & Goals */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Header Card */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-white to-gray-50/50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                             <Quote className="h-24 w-24" />
                        </div>
                        <CardHeader className="pb-8 pt-10 px-8">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                                <div className="relative">
                                    <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
                                        <AvatarImage src={mentee.avatar_url} />
                                        <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{fullName}</h1>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold uppercase tracking-wider text-[10px]">
                                            Buscando Mentoria
                                        </Badge>
                                    </div>
                                    <p className="text-xl text-gray-600 font-medium">
                                        {mentee.job_title || 'Mentorado'}
                                        {mentee.company && <span className="text-gray-400 font-normal"> em {mentee.company}</span>}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 pt-2 font-medium">
                                        {(mentee.city || mentee.country) && (
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-1.5 text-primary/60" />
                                                {[mentee.city, mentee.state, mentee.country].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1.5 text-primary/60" />
                                            Na plataforma desde {formatDate(mentee.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Proactive Help CTA for Mentors */}
                    {isMentor && !isOwner && (
                        <Card className="bg-primary text-white border-none shadow-lg overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <Sparkles className="h-5 w-5" />
                                            Seja o mentor que o {mentee.first_name} precisa!
                                        </h3>
                                        <p className="text-primary-foreground/80 text-sm">
                                            Viu que você pode ajudar com os desafios deste membro? Inicie uma conversa agora.
                                        </p>
                                    </div>
                                    <Button 
                                        size="lg" 
                                        onClick={handleChat}
                                        className="bg-white text-primary hover:bg-white/90 font-bold px-8 shadow-xl transition-transform group-hover:scale-105"
                                    >
                                        <MessageCircle className="h-5 w-5 mr-2" />
                                        Oferecer Ajuda
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bio / Story */}
                    {mentee.bio && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
                                <User className="h-5 w-5 text-primary" />
                                Minha História
                            </h3>
                            <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-6">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap italic">
                                        "{mentee.bio}"
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* What I want to learn */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 px-1">
                            <BookOpen className="h-5 w-5 text-primary" />
                            O que desejo aprender
                        </h3>
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {mentee.mentorship_topics && mentee.mentorship_topics.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {mentee.mentorship_topics.map((topic, i) => (
                                                <Badge key={i} className="px-4 py-1.5 bg-primary/5 text-primary border-primary/20 text-sm font-semibold rounded-full">
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic text-sm">Nenhum tópico específico listado ainda.</p>
                                    )}

                                    {mentee.career_goals && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-primary" />
                                                Objetivos de Curto/Médio Prazo
                                            </h4>
                                            <p className="text-gray-700 leading-relaxed">
                                                {mentee.career_goals}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Background & Links */}
                <div className="space-y-8">
                    {/* Education & Experience Sidebar */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <div className="h-2 bg-primary"></div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Formação e Carreira</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(mentee.institution || mentee.course) && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary">
                                        <GraduationCap className="h-5 w-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Acadêmico</span>
                                    </div>
                                    <div className="pl-7 space-y-1">
                                        {mentee.course && <p className="font-bold text-gray-900 leading-tight">{mentee.course}</p>}
                                        {mentee.institution && <p className="text-sm text-gray-600 font-medium">{mentee.institution}</p>}
                                        {mentee.academic_level && <Badge variant="outline" className="mt-2 text-[10px] uppercase">{mentee.academic_level}</Badge>}
                                        {mentee.expected_graduation && <p className="text-xs text-muted-foreground mt-1">Conclusão: {mentee.expected_graduation}</p>}
                                    </div>
                                </div>
                            )}

                            {(mentee.job_title || mentee.company) && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Briefcase className="h-5 w-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Profissional</span>
                                    </div>
                                    <div className="pl-7 space-y-1">
                                        {mentee.job_title && <p className="font-bold text-gray-900 leading-tight">{mentee.job_title}</p>}
                                        {mentee.company && <p className="text-sm text-gray-600 font-medium">{mentee.company}</p>}
                                    </div>
                                </div>
                            )}

                            {mentee.languages && mentee.languages.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Languages className="h-5 w-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Idiomas</span>
                                    </div>
                                    <div className="pl-7 flex flex-wrap gap-1.5">
                                        {mentee.languages.map((lang, i) => (
                                            <span key={i} className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resume / CV Section */}
                    {mentee.cv_url && (
                        <Card className="border-2 border-primary/10 shadow-md bg-white hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Currículo / Trajetória
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="default"
                                    className="w-full font-bold shadow-lg shadow-primary/20"
                                    onClick={() => setIsPdfViewerOpen(true)}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar PDF
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Social Links */}
                    {(mentee.linkedin_url || mentee.github_url || mentee.portfolio_url) && (
                        <Card className="border-none shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Links e Redes</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-2">
                                {mentee.linkedin_url && (
                                    <Button variant="outline" size="icon" className="w-full text-blue-600 border-blue-100 hover:bg-blue-50" asChild>
                                        <a href={mentee.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="h-5 w-5" />
                                        </a>
                                    </Button>
                                )}
                                {mentee.github_url && (
                                    <Button variant="outline" size="icon" className="w-full text-gray-900 border-gray-100 hover:bg-gray-50" asChild>
                                        <a href={mentee.github_url} target="_blank" rel="noopener noreferrer">
                                            <Github className="h-5 w-5" />
                                        </a>
                                    </Button>
                                )}
                                {mentee.portfolio_url && (
                                    <Button variant="outline" size="icon" className="w-full text-primary border-primary/10 hover:bg-primary/5" asChild>
                                        <a href={mentee.portfolio_url} target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-5 w-5" />
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
