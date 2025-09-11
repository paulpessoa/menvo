"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { createClient } from "@/utils/supabase/client"
import { MentorCard } from "@/components/admin/MentorCard"
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb"
import { toast } from "sonner"

interface PendingMentor {
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

export default function VerifyMentorsPage() {
    const [pendingMentors, setPendingMentors] = useState<PendingMentor[]>([])
    const [loading, setLoading] = useState(true)
    const [verifyingAll, setVerifyingAll] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchPendingMentors()
    }, [])

    const fetchPendingMentors = async () => {
        setLoading(true)

        try {
            const { data, error } = await supabase
                .from('mentors_admin_view')
                .select('*')
                .eq('verified', false)
                .order('created_at', { ascending: false })

            if (error) throw error

            setPendingMentors(data || [])
        } catch (error) {
            console.error('Error fetching pending mentors:', error)
            toast.error('Erro ao carregar mentores pendentes')
        } finally {
            setLoading(false)
        }
    }

    const handleVerificationChange = (mentorId: string, verified: boolean) => {
        if (verified) {
            // Remove from pending list when verified
            setPendingMentors(prev => prev.filter(m => m.id !== mentorId))
        } else {
            // Update the mentor in the list when unverified
            setPendingMentors(prev =>
                prev.map(mentor =>
                    mentor.id === mentorId
                        ? { ...mentor, verified }
                        : mentor
                )
            )
        }
    }

    const handleVerifyAll = async () => {
        if (pendingMentors.length === 0) return

        setVerifyingAll(true)

        try {
            const mentorIds = pendingMentors.map(m => m.id)

            const { error } = await supabase
                .from('profiles')
                .update({
                    verified: true,
                    updated_at: new Date().toISOString()
                })
                .in('id', mentorIds)

            if (error) throw error

            toast.success(`${pendingMentors.length} mentores foram verificados com sucesso`)
            setPendingMentors([])
        } catch (error) {
            console.error('Error verifying all mentors:', error)
            toast.error('Erro ao verificar todos os mentores')
        } finally {
            setVerifyingAll(false)
        }
    }

    if (loading) {
        return (
            <RequireRole roles={['admin']}>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Carregando mentores pendentes...</span>
                    </div>
                </div>
            </RequireRole>
        )
    }

    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <AdminBreadcrumb />
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/mentors">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Link>
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">Verificar Mentores</h1>
                            <p className="text-muted-foreground">
                                Revise e aprove mentores aguardando verificação
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-600" />
                                Mentores Pendentes
                            </CardTitle>
                            <CardDescription>
                                {pendingMentors.length} mentor(es) aguardando verificação
                            </CardDescription>
                        </CardHeader>
                        {pendingMentors.length > 0 && (
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                            {pendingMentors.length} pendente(s)
                                        </Badge>
                                    </div>
                                    <Button
                                        onClick={handleVerifyAll}
                                        disabled={verifyingAll}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {verifyingAll ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Verificar Todos
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Mentors List */}
                    {pendingMentors.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">
                                    Todos os mentores estão verificados!
                                </h3>
                                <p className="text-muted-foreground text-center mb-6">
                                    Não há mentores aguardando verificação no momento.
                                </p>
                                <Button asChild>
                                    <Link href="/admin/mentors">
                                        Ver Todos os Mentores
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingMentors.map((mentor) => (
                                <MentorCard
                                    key={mentor.id}
                                    mentor={mentor}
                                    onVerificationChange={handleVerificationChange}
                                />
                            ))}
                        </div>
                    )}

                    {/* Help Text */}
                    {pendingMentors.length > 0 && (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 mb-1">
                                            Dicas para Verificação de Mentores
                                        </h4>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            <li>• Verifique se o perfil está completo com bio e áreas de expertise</li>
                                            <li>• Confirme se a experiência profissional é relevante</li>
                                            <li>• Mentores verificados ficam visíveis publicamente na plataforma</li>
                                            <li>• Você pode remover a verificação a qualquer momento se necessário</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </RequireRole>
    )
}