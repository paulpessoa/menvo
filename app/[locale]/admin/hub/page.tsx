"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, ExternalLink, Link as LinkIcon, Save, Trash2, Loader2 } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { hubService, type HubResource } from "@/services/hub/hub"

export default function AdminHub() {
    const [pendingResources, setPendingUsers] = useState<HubResource[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchPending()
    }, [])

    const fetchPending = async () => {
        setLoading(true)
        try {
            const data = await hubService.getPendingResources()
            setPendingUsers(data)
        } catch (error) {
            console.error('Error fetching pending resources:', error)
            toast.error("Erro ao carregar pendências")
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id: string, status: 'published' | 'rejected' | 'archived', updatedData?: Partial<HubResource>) => {
        setProcessingId(id)
        try {
            const { error } = await supabase
                .from('hub_resources')
                .update({ 
                    ...updatedData,
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            toast.success(status === 'published' ? "Publicado no Hub!" : "Ação realizada")
            setPendingUsers(prev => prev.filter(r => r.id !== id))
        } catch (error) {
            console.error('Error updating hub resource:', error)
            toast.error("Erro ao processar ação")
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )
    }

    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold">Moderação do Hub</h1>
                        <p className="text-muted-foreground">
                            Revise as sugestões da comunidade e publique links de afiliados.
                        </p>
                    </div>

                    {pendingResources.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                <h3 className="text-lg font-semibold">Nenhuma sugestão pendente</h3>
                                <p className="text-muted-foreground">O Hub está atualizado!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {pendingResources.map((res) => (
                                <HubModerationCard 
                                    key={res.id} 
                                    resource={res} 
                                    onAction={handleAction}
                                    isProcessing={processingId === res.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </RequireRole>
    )
}

function HubModerationCard({ resource, onAction, isProcessing }: { 
    resource: HubResource, 
    onAction: (id: string, status: any, data: any) => void,
    isProcessing: boolean 
}) {
    const [editData, setEditData] = useState({
        title: resource.title,
        url: resource.url,
        description: resource.description || "",
        badge_text: resource.badge_text || "",
        is_affiliate: resource.is_affiliate,
        image_url: resource.image_url || ""
    })

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Badge>{resource.type}</Badge>
                        <span className="text-xs text-muted-foreground">Sugerido em {new Date(resource.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => onAction(resource.id, 'rejected', {})}
                            disabled={isProcessing}
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onAction(resource.id, 'published', editData)}
                            disabled={isProcessing}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" /> Publicar
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título do Recurso</Label>
                            <Input 
                                value={editData.title} 
                                onChange={e => setEditData({...editData, title: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                URL (Link de Afiliado)
                                <a href={resource.url} target="_blank" rel="noopener" className="text-[10px] text-blue-500 flex items-center">
                                    Ver original <ExternalLink className="h-2 w-2 ml-1" />
                                </a>
                            </Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-10"
                                    value={editData.url} 
                                    onChange={e => setEditData({...editData, url: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <input 
                                type="checkbox" 
                                id={`affiliate-${resource.id}`}
                                checked={editData.is_affiliate}
                                onChange={e => setEditData({...editData, is_affiliate: e.target.checked})}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`affiliate-${resource.id}`}>Marcar como Link de Afiliado/Parceiro</Label>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Descrição Curta</Label>
                            <Textarea 
                                className="min-h-[80px]"
                                value={editData.description} 
                                onChange={e => setEditData({...editData, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Texto do Selo</Label>
                                <Input 
                                    placeholder="Ex: Grátis"
                                    value={editData.badge_text} 
                                    onChange={e => setEditData({...editData, badge_text: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL da Imagem</Label>
                                <Input 
                                    placeholder="https://..."
                                    value={editData.image_url} 
                                    onChange={e => setEditData({...editData, image_url: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
