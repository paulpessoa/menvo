"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Search,
    Filter,
    Users,
    CheckCircle,
    Clock,
    Loader2,
    RefreshCw,
    AlertTriangle
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { MentorCard } from "./MentorCard"
import { toast } from "sonner"

interface Mentor {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    bio: string | null
    avatar_url: string | null
    verified: boolean
    current_position: string | null
    current_company: string | null
    expertise_areas: string[] | null
    location: string | null
    created_at: string
}

interface MentorStats {
    total: number
    verified: number
    pending: number
}

export function MentorManagementPanel() {
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([])
    const [stats, setStats] = useState<MentorStats>({ total: 0, verified: 0, pending: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("all")

    const supabase = createClient()

    useEffect(() => {
        fetchMentors()
    }, [])

    useEffect(() => {
        filterMentors()
    }, [mentors, searchTerm, activeTab])

    const fetchMentors = async () => {
        setLoading(true)

        try {
            // Use mentors_admin_view to get all mentors (verified and unverified)
            const { data, error } = await supabase
                .from('mentors_admin_view')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            const mentorData = data || []
            setMentors(mentorData)

            // Calculate stats
            const total = mentorData.length
            const verified = mentorData.filter(m => m.verified).length
            const pending = total - verified

            setStats({ total, verified, pending })
        } catch (error) {
            console.error('Error fetching mentors:', error)
            toast.error('Erro ao carregar mentores')
        } finally {
            setLoading(false)
        }
    }

    const filterMentors = () => {
        let filtered = mentors

        // Filter by tab
        switch (activeTab) {
            case 'verified':
                filtered = filtered.filter(m => m.verified)
                break
            case 'pending':
                filtered = filtered.filter(m => !m.verified)
                break
            // 'all' shows everything
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(mentor =>
                mentor.full_name.toLowerCase().includes(term) ||
                mentor.email.toLowerCase().includes(term) ||
                mentor.current_position?.toLowerCase().includes(term) ||
                mentor.current_company?.toLowerCase().includes(term) ||
                mentor.expertise_areas?.some(skill =>
                    skill.toLowerCase().includes(term)
                )
            )
        }

        setFilteredMentors(filtered)
    }

    const handleVerificationChange = (mentorId: string, verified: boolean) => {
        setMentors(prev =>
            prev.map(mentor =>
                mentor.id === mentorId
                    ? { ...mentor, verified }
                    : mentor
            )
        )

        // Update stats
        setStats(prev => ({
            ...prev,
            verified: verified ? prev.verified + 1 : prev.verified - 1,
            pending: verified ? prev.pending - 1 : prev.pending + 1
        }))
    }

    const getTabCount = (tab: string) => {
        switch (tab) {
            case 'all':
                return stats.total
            case 'verified':
                return stats.verified
            case 'pending':
                return stats.pending
            default:
                return 0
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando mentores...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Mentores</h1>
                    <p className="text-muted-foreground">
                        Gerencie e verifique mentores da plataforma
                    </p>
                </div>
                <Button onClick={fetchMentors} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Mentores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Todos os mentores cadastrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mentores Verificados</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                        <p className="text-xs text-muted-foreground">
                            Visíveis publicamente
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aguardando Verificação</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">
                            Precisam de aprovação
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, email, cargo, empresa ou habilidade..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mentors List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Lista de Mentores</CardTitle>
                    <CardDescription>
                        {filteredMentors.length} mentor(es) encontrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all" className="flex items-center gap-2">
                                Todos
                                <Badge variant="secondary" className="ml-1">
                                    {getTabCount('all')}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="verified" className="flex items-center gap-2">
                                Verificados
                                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800">
                                    {getTabCount('verified')}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                Pendentes
                                <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">
                                    {getTabCount('pending')}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {filteredMentors.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum mentor encontrado</h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm
                                            ? "Tente ajustar os filtros de busca"
                                            : "Não há mentores nesta categoria"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredMentors.map((mentor) => (
                                        <MentorCard
                                            key={mentor.id}
                                            mentor={mentor}
                                            onVerificationChange={handleVerificationChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}