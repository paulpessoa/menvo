"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, ExternalLink, Link as LinkIcon, Save, Trash2, Loader2, MapPin, Calendar, Clock, Camera, Upload } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { hubService, type HubResource } from "@/services/hub/hub"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"

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
                            Revise as sugestões e enriqueça com seus links de parceiro.
                        </p>
                    </div>

                    {pendingResources.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                <h3 className="text-lg font-semibold">Tudo revisado!</h3>
                                <p className="text-muted-foreground">Não há sugestões pendentes no momento.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-8">
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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageUpload = useSimpleImageUpload('/api/upload/profile-photo')

    const [editData, setEditData] = useState({
        title: resource.title,
        url: resource.url,
        description: resource.description || "",
        badge_text: resource.badge_text || "",
        is_affiliate: resource.is_affiliate,
        image_url: resource.image_url || "",
        address: (resource as any).address || "",
        location_url: (resource as any).location_url || "",
        event_date: (resource as any).event_date || "",
        event_time: (resource as any).event_time || ""
    })

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const result = await imageUpload.upload(file)
        if (result.success) {
            setEditData(prev => ({ ...prev, image_url: result.data.url }))
            toast.success("Imagem atualizada!")
        }
    }

    return (
        <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-white">{resource.type.toUpperCase()}</Badge>
                        <span className="text-xs text-muted-foreground">Sugerido por: {resource.user_id}</span>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            variant="destructive" 
                            size="sm"
                            className="flex-1 md:flex-none"
                            onClick={() => onAction(resource.id, 'rejected', {})}
                            disabled={isProcessing}
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
                            size="sm"
                            onClick={() => onAction(resource.id, 'published', editData)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Aprovar e Publicar</>}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna 1: Imagem e SEO */}
                    <div className="space-y-4">
                        <Label className="font-bold text-sm uppercase">Imagem de Capa</Label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-video border-2 border-dashed rounded-lg overflow-hidden relative cursor-pointer group"
                        >
                            {editData.image_url ? (
                                <img src={editData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-muted/50">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-xs mt-1">Upload</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                Trocar Imagem
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        
                        <div className="space-y-2 pt-2">
                            <Label>Selo de Destaque</Label>
                            <Input 
                                value={editData.badge_text} 
                                onChange={e => setEditData({...editData, badge_text: e.target.value})}
                                placeholder="Ex: Cupom: TECH20"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <input 
                                type="checkbox" 
                                id={`aff-${resource.id}`}
                                checked={editData.is_affiliate}
                                onChange={e => setEditData({...editData, is_affiliate: e.target.checked})}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`aff-${resource.id}`} className="text-blue-900 font-semibold cursor-pointer">Link de Afiliado/Parceiro</Label>
                        </div>
                    </div>

                    {/* Coluna 2: Dados Principais */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input 
                                    value={editData.title} 
                                    onChange={e => setEditData({...editData, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex justify-between items-center">
                                    Link Principal
                                    <a href={resource.url} target="_blank" rel="noopener" className="text-[10px] text-blue-500 flex items-center">Original <ExternalLink className="h-2 w-2 ml-0.5" /></a>
                                </Label>
                                <Input 
                                    value={editData.url} 
                                    onChange={e => setEditData({...editData, url: e.target.value})}
                                    className="bg-blue-50/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea 
                                value={editData.description} 
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                className="min-h-[100px]"
                            />
                        </div>

                        {/* Localização e Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço/Plataforma</Label>
                                    <Input 
                                        value={editData.address} 
                                        onChange={e => setEditData({...editData, address: e.target.value})}
                                        placeholder="Ex: Online (Zoom)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Link do Google Maps</Label>
                                    <Input 
                                        value={editData.location_url} 
                                        onChange={e => setEditData({...editData, location_url: e.target.value})}
                                        placeholder="https://maps.google.com/..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Data do Evento</Label>
                                    <Input 
                                        type="date"
                                        value={editData.event_date} 
                                        onChange={e => setEditData({...editData, event_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Horário</Label>
                                    <Input 
                                        type="time"
                                        value={editData.event_time} 
                                        onChange={e => setEditData({...editData, event_time: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
