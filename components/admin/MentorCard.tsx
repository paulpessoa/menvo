"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    MapPin,
    Briefcase,
    Mail,
    Loader2,
    AlertTriangle
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface MentorCardProps {
    mentor: {
        id: string
        email: string
        first_name: string | null
        last_name: string | null
        full_name: string
        bio: string | null
        avatar_url: string | null
        verified: boolean
        current_position: string | null
        current_company: string | null
        expertise_areas: string[] | null
        location: string | null
        created_at: string
        profile_status?: string
    }
    onVerificationChange?: (mentorId: string, verified: boolean) => void
    showActions?: boolean
}

export function MentorCard({ mentor, onVerificationChange, showActions = true }: MentorCardProps) {
    const [isVerifying, setIsVerifying] = useState(false)
    const supabase = createClient()

    // Check if profile is complete
    const isProfileComplete = () => {
        return mentor.first_name &&
            mentor.last_name &&
            mentor.bio &&
            mentor.bio.trim().length > 0
    }

    const handleVerification = async (verified: boolean) => {
        // Prevent verification if profile is incomplete
        if (verified && !isProfileComplete()) {
            toast.error('O perfil do mentor está incompleto. É necessário ter nome e bio preenchidos.')
            return
        }

        setIsVerifying(true)

        try {
            const updateData: any = {
                verified,
                updated_at: new Date().toISOString()
            }

            // Add verified_at timestamp when verifying
            if (verified) {
                updateData.verified_at = new Date().toISOString()
            } else {
                updateData.verified_at = null
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', mentor.id)

            if (error) throw error

            toast.success(
                verified
                    ? `${mentor.full_name} foi verificado como mentor`
                    : `Verificação de ${mentor.full_name} foi removida`
            )

            onVerificationChange?.(mentor.id, verified)
        } catch (error) {
            console.error('Error updating mentor verification:', error)
            toast.error('Erro ao atualizar verificação do mentor')
        } finally {
            setIsVerifying(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={mentor.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10">
                            {getInitials(mentor.full_name)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="font-semibold text-lg truncate">
                                    {mentor.full_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant={mentor.verified ? "default" : "secondary"}
                                        className={mentor.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                    >
                                        {mentor.verified ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Verificado
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-3 w-3 mr-1" />
                                                Pendente
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Professional Info */}
                        {(mentor.current_position || mentor.current_company) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Briefcase className="h-4 w-4" />
                                <span>
                                    {mentor.current_position}
                                    {mentor.current_position && mentor.current_company && ' @ '}
                                    {mentor.current_company}
                                </span>
                            </div>
                        )}

                        {/* Contact */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{mentor.email}</span>
                        </div>

                        {/* Location */}
                        {mentor.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4" />
                                <span>{mentor.location}</span>
                            </div>
                        )}

                        {/* Bio */}
                        {mentor.bio && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {mentor.bio}
                            </p>
                        )}

                        {/* Expertise */}
                        {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Áreas de Expertise:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {mentor.expertise_areas.slice(0, 3).map((skill, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {mentor.expertise_areas.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{mentor.expertise_areas.length - 3} mais
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Profile Status Warning */}
                        {!isProfileComplete() && (
                            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-yellow-800">
                                        <p className="font-medium mb-1">Perfil Incompleto</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {!mentor.first_name && <li>Nome não preenchido</li>}
                                            {!mentor.last_name && <li>Sobrenome não preenchido</li>}
                                            {(!mentor.bio || mentor.bio.trim().length === 0) && <li>Bio não preenchida</li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Registration Date */}
                        <p className="text-xs text-muted-foreground mb-4">
                            Cadastrado em {formatDate(mentor.created_at)}
                        </p>

                        {/* Actions */}
                        {showActions && (
                            <div className="flex gap-2">
                                {!mentor.verified ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handleVerification(true)}
                                        disabled={isVerifying || !isProfileComplete()}
                                        className="bg-green-600 hover:bg-green-700"
                                        title={!isProfileComplete() ? 'Perfil incompleto - não pode ser verificado' : ''}
                                    >
                                        {isVerifying ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                        )}
                                        Verificar
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleVerification(false)}
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                            <XCircle className="h-4 w-4 mr-1" />
                                        )}
                                        Remover Verificação
                                    </Button>
                                )}

                                <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver Perfil
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}