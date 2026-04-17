"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { CheckCircle, XCircle, ExternalLink, Play, MessageSquare, AlertCircle } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { createClient } from "@/utils/supabase/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Profile {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    bio: string | null
    expertise_areas: string[] | null
    linkedin_url: string | null
    presentation_video_url: string | null
    verification_status: string
    role: string
    created_at: string
}

export default function AdminVerifications() {
    const t = useTranslations("admin")
    const common = useTranslations("common")
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [filterRole, setFilterRole] = useState<string>("all")
    const supabase = createClient()

    // Canned Responses (Feedback Rápido)
    const cannedFeedbacks = [
        { label: "Foto de perfil ausente", value: "Por favor, adicione uma foto de perfil clara para aumentar a confiança dos mentees." },
        { label: "LinkedIn não informado", value: "Seu perfil do LinkedIn é essencial para validarmos sua trajetória profissional." },
        { label: "Bio muito curta", value: "Sua biografia está muito resumida. Conte um pouco mais sobre sua experiência e como você pode ajudar." },
        { label: "Especialidades genéricas", value: "Tente ser mais específico nas suas áreas de expertise para atrair os mentees certos." },
        { label: "Vídeo com problema", value: "Não conseguimos reproduzir seu vídeo de apresentação. Poderia verificar o link?" }
    ]

    useEffect(() => {
        fetchPendingUsers()
    }, [filterRole])

    const fetchPendingUsers = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from("profiles")
                .select("*")
                .eq("verification_status", "pending")
                .order("created_at", { ascending: true })
            
            if (filterRole !== "all") {
                query = query.eq("role", filterRole)
            }

            const { data, error } = await query

            if (error) throw error
            setPendingUsers(data as Profile[] || [])
        } catch (error) {
            console.error('Error fetching pending users:', error)
            toast.error("Erro ao carregar usuários pendentes")
        } finally {
            setLoading(false)
        }
    }

    const handleVerification = async (userId: string, status: "approved" | "rejected", notes?: string) => {
        setProcessingId(userId)
        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status, notes })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao processar verificação")
            }

            toast.success(status === 'approved' ? "Perfil aprovado com sucesso!" : "Feedback enviado ao usuário")
            setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
        } catch (error: any) {
            console.error('Error updating verification:', error)
            toast.error(error.message)
        } finally {
            setProcessingId(null)
        }
    }

    const setCannedFeedback = (userId: string, feedback: string) => {
        const textarea = document.getElementById(`notes-${userId}`) as HTMLTextAreaElement
        if (textarea) {
            textarea.value = feedback
        }
    }

    const getYouTubeVideoId = (url: string) => {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
        const match = url.match(regex)
        return match ? match[1] : null
    }

    if (loading && pendingUsers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">{t("actions.verifyMentors")}</h1>
                            <p className="text-muted-foreground">
                                {t("alerts.pendingMentorsDesc", { count: pendingUsers.length })}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Filtrar por:</span>
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Papel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="mentor">Mentores</SelectItem>
                                    <SelectItem value="company">Organizações</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
                                <p className="text-muted-foreground text-center">
                                    Não existem solicitações de verificação pendentes no momento.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {pendingUsers.map((user) => (
                                <Card key={user.id} className="overflow-hidden border-l-4 border-l-yellow-500">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-16 w-16 border">
                                                    <AvatarImage src={user.avatar_url || ""} />
                                                    <AvatarFallback>{user.full_name?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-xl">{user.full_name}</CardTitle>
                                                        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                                                    </div>
                                                    <CardDescription className="text-base">{user.email}</CardDescription>
                                                    <Badge variant="outline" className="mt-2 font-normal">
                                                        Cadastrado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-sm font-semibold flex items-center gap-2 mb-1">
                                                        <AlertCircle className="h-4 w-4 text-blue-500" /> Biografia
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                                                        {user.bio || "Não informado"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-semibold flex items-center gap-2 mb-1">
                                                        <CheckCircle className="h-4 w-4 text-green-500" /> Especialidades
                                                    </Label>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.expertise_areas && user.expertise_areas.length > 0 ? (
                                                            user.expertise_areas.map((area, i) => (
                                                                <Badge key={i} variant="outline" className="font-normal">{area}</Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">Nenhuma informada</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {user.linkedin_url && (
                                                    <div>
                                                        <Label className="text-sm font-semibold mb-1 block">LinkedIn</Label>
                                                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                                            <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4 mr-2" /> Ver Perfil Profissional
                                                            </a>
                                                        </Button>
                                                    </div>
                                                )}

                                                {user.presentation_video_url && (
                                                    <div>
                                                        <Label className="text-sm font-semibold mb-1 block">Vídeo de Apresentação</Label>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="w-full justify-start">
                                                                    <Play className="h-4 w-4 mr-2" /> Assistir Vídeo
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-4xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>Vídeo de Apresentação - {user.full_name}</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="aspect-video">
                                                                    {getYouTubeVideoId(user.presentation_video_url) ? (
                                                                        <iframe
                                                                            width="100%"
                                                                            height="100%"
                                                                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(user.presentation_video_url)}`}
                                                                            title="Vídeo de apresentação"
                                                                            frameBorder="0"
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                            allowFullScreen
                                                                        />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center h-full bg-muted">
                                                                            <p>URL de vídeo inválida</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Feedback & Actions */}
                                        <div className="pt-6 border-t space-y-4">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor={`notes-${user.id}`} className="text-sm font-semibold">
                                                            Feedback para o Usuário
                                                        </Label>
                                                        <Select onValueChange={(val) => setCannedFeedback(user.id, val)}>
                                                            <SelectTrigger className="w-[200px] h-8 text-xs">
                                                                <SelectValue placeholder="Resposta Rápida" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {cannedFeedbacks.map((cf, i) => (
                                                                    <SelectItem key={i} value={cf.value}>{cf.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Textarea
                                                        id={`notes-${user.id}`}
                                                        placeholder="Sua mensagem será enviada via chat para o usuário..."
                                                        className="min-h-[100px] text-sm"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-2 md:w-56">
                                                    <Button
                                                        onClick={() => {
                                                            const textarea = document.getElementById(`notes-${user.id}`) as HTMLTextAreaElement
                                                            handleVerification(user.id, "approved", textarea?.value)
                                                        }}
                                                        disabled={processingId === user.id}
                                                        className="bg-green-600 hover:bg-green-700 w-full"
                                                    >
                                                        {processingId === user.id ? (
                                                            "Processando..."
                                                        ) : (
                                                            <><CheckCircle className="h-4 w-4 mr-2" /> Aprovar e Publicar</>
                                                        )}
                                                    </Button>

                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            const textarea = document.getElementById(`notes-${user.id}`) as HTMLTextAreaElement
                                                            if (!textarea?.value) {
                                                                toast.error("Por favor, adicione uma nota explicando o motivo da rejeição.")
                                                                return
                                                            }
                                                            handleVerification(user.id, "rejected", textarea?.value)
                                                        }}
                                                        disabled={processingId === user.id}
                                                        className="w-full"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" /> Rejeitar com Ajustes
                                                    </Button>
                                                    
                                                    <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                                                        <MessageSquare className="h-3 w-3" /> Notificação automática via chat
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </RequireRole>
    )
}
