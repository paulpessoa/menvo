"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Clock,
    User,
    Mail,
    Calendar,
    ExternalLink,
    AlertCircle
} from "lucide-react"
import { RequireAdmin } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import { toast } from "@/hooks/use-toast"

interface MentorProfile {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    avatar_url: string | null
    slug: string | null
    verified: boolean
    bio: string | null
    expertise_areas: string[] | null
    linkedin_url: string | null
    created_at: string
}

export default function MentorVerificationPage() {
    const { profile } = useAuth()
    const [mentors, setMentors] = useState<MentorProfile[]>([])
    const [filteredMentors, setFilteredMentors] = useState<MentorProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified">("pending")
    const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set())

    const supabase = createClient()

    // Fetch mentors data
    const fetchMentors = async () => {
        try {
            setLoading(true)

            // Get all users with mentor role
            const { data: mentorRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select(`
          user_id,
          profiles!inner (
            id,
            email,
            first_name,
            last_name,
            full_name,
            avatar_url,
            slug,
            verified,
            bio,
            expertise_areas,
            linkedin_url,
            created_at
          ),
          roles!inner (
            name
          )
        `)
                .eq('roles.name', 'mentor')

            if (rolesError) {
                console.error('Error fetching mentors:', rolesError)
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar a lista de mentores.",
                    variant: "destructive"
                })
                return
            }

            const mentorProfiles = mentorRoles?.map(role => role.profiles).filter(Boolean) || []
            setMentors(mentorProfiles)

        } catch (error) {
            console.error('Error in fetchMentors:', error)
            toast({
                title: "Erro",
                description: "Erro inesperado ao carregar mentores.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    // Filter mentors based on search and status
    useEffect(() => {
        let filtered = mentors

        // Filter by status
        if (filterStatus === "pending") {
            filtered = filtered.filter(mentor => !mentor.verified)
        } else if (filterStatus === "verified") {
            filtered = filtered.filter(mentor => mentor.verified)
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(mentor =>
                mentor.full_name?.toLowerCase().includes(term) ||
                mentor.email.toLowerCase().includes(term) ||
                mentor.expertise_areas?.some(area => area.toLowerCase().includes(term))
            )
        }

        setFilteredMentors(filtered)
    }, [mentors, searchTerm, filterStatus])

    // Verify mentor
    const verifyMentor = async (mentorId: string, verified: boolean) => {
        try {
            setVerifyingIds(prev => new Set(prev).add(mentorId))

            // Call API endpoint to verify mentor
            const response = await fetch('/api/mentors/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mentorId,
                    verified,
                    adminId: profile?.id
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao verificar mentor')
            }

            // Update local state
            setMentors(prev =>
                prev.map(mentor =>
                    mentor.id === mentorId
                        ? { ...mentor, verified }
                        : mentor
                )
            )

            toast({
                title: "Sucesso",
                description: `Mentor ${verified ? 'verificado' : 'rejeitado'} com sucesso.`,
                variant: "default"
            })

        } catch (error) {
            console.error('Error verifying mentor:', error)
            toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Erro ao verificar mentor.",
                variant: "destructive"
            })
        } finally {
            setVerifyingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(mentorId)
                return newSet
            })
        }
    }

    // Load mentors on component mount
    useEffect(() => {
        fetchMentors()
    }, [])

    const getInitials = (name: string | null) => {
        if (!name) return "?"
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const pendingCount = mentors.filter(m => !m.verified).length
    const verifiedCount = mentors.filter(m => m.verified).length

    return (
        <RequireAdmin>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">Verificação de Mentores</h1>
                        <p className="text-muted-foreground">
                            Revise e aprove mentores para aparecerem na listagem pública.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                                <Clock className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    Aguardando verificação
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Verificados</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    Mentores ativos
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total</CardTitle>
                                <User className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{mentors.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Mentores cadastrados
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Filtros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Buscar por nome, email ou especialidade..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={filterStatus === "all" ? "default" : "outline"}
                                        onClick={() => setFilterStatus("all")}
                                        size="sm"
                                    >
                                        Todos ({mentors.length})
                                    </Button>
                                    <Button
                                        variant={filterStatus === "pending" ? "default" : "outline"}
                                        onClick={() => setFilterStatus("pending")}
                                        size="sm"
                                    >
                                        Pendentes ({pendingCount})
                                    </Button>
                                    <Button
                                        variant={filterStatus === "verified" ? "default" : "outline"}
                                        onClick={() => setFilterStatus("verified")}
                                        size="sm"
                                    >
                                        Verificados ({verifiedCount})
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mentors List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : filteredMentors.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Nenhum mentor encontrado</h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm || filterStatus !== "all"
                                            ? "Tente ajustar os filtros de busca."
                                            : "Não há mentores cadastrados ainda."
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredMentors.map((mentor) => (
                                <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Avatar */}
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={mentor.avatar_url || undefined} />
                                                <AvatarFallback className="text-lg">
                                                    {getInitials(mentor.full_name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Mentor Info */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl font-semibold">
                                                        {mentor.full_name || "Nome não informado"}
                                                    </h3>
                                                    <Badge variant={mentor.verified ? "default" : "secondary"}>
                                                        {mentor.verified ? "Verificado" : "Pendente"}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-4 w-4" />
                                                        {mentor.email}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        Cadastrado em {formatDate(mentor.created_at)}
                                                    </div>
                                                </div>

                                                {mentor.bio && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {mentor.bio}
                                                    </p>
                                                )}

                                                {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {mentor.expertise_areas.map((area, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {area}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {mentor.linkedin_url && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <ExternalLink className="h-4 w-4" />
                                                        <a
                                                            href={mentor.linkedin_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            LinkedIn
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                {!mentor.verified ? (
                                                    <>
                                                        <Button
                                                            onClick={() => verifyMentor(mentor.id, true)}
                                                            disabled={verifyingIds.has(mentor.id)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                            size="sm"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            {verifyingIds.has(mentor.id) ? "Verificando..." : "Verificar"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => verifyMentor(mentor.id, false)}
                                                            disabled={verifyingIds.has(mentor.id)}
                                                            variant="outline"
                                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                                            size="sm"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Rejeitar
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        onClick={() => verifyMentor(mentor.id, false)}
                                                        disabled={verifyingIds.has(mentor.id)}
                                                        variant="outline"
                                                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                                        size="sm"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        {verifyingIds.has(mentor.id) ? "Removendo..." : "Remover Verificação"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </RequireAdmin>
    )
}