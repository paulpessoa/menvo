"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, ExternalLink, Link as LinkIcon, Save, Trash2, Loader2, MapPin, Calendar, Clock, Camera, Archive, RefreshCw } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { createClient } from "@/lib/utils/supabase/client"
import { toast } from "sonner"
import { hubService } from "@/services/hub/hub"
import type { HubResource, HubResourceStatus } from "@/lib/types/models/hub"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"

export default function AdminHub() {
    const [resources, setResources] = useState<HubResource[]>([])
    const [loading, setLoading] = useState(true)
    const [activeStatus, setActiveStatus] = useState<HubResourceStatus>('pending')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchResources()
    }, [activeStatus])

    const fetchResources = async () => {
        setLoading(true)
        try {
            const data = await hubService.getAdminResources(activeStatus)
            setResources(data)
        } catch (error) {
            console.error('Error fetching hub resources:', error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id: string, status: HubResourceStatus, updatedData?: Partial<HubResource>) => {
        setProcessingId(id)
        try {
            const { error } = await (supabase
                .from('hub_resources')
                .update({ 
                    ...updatedData,
                    status,
                    updated_at: new Date().toISOString()
                } as any)
                .eq('id', id) as any)


            if (error) throw error

            toast.success(status === 'published' ? "Publicado com sucesso!" : "Status atualizado")
            // Removemos da lista local se o status mudar para algo fora da aba atual
            if (status !== activeStatus) {
                setResources(prev => prev.filter(r => r.id !== id))
            }
        } catch (error) {
            console.error('Error updating hub resource:', error)
            toast.error("Erro ao processar ação")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Gerenciamento do Menvo Hub</h1>
                            <p className="text-muted-foreground">
                                Modere sugestões e gerencie o conteúdo do mural.
                            </p>
                        </div>
                        <Button onClick={fetchResources} variant="outline" size="sm">
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
                        </Button>
                    </div>

                    <Tabs value={activeStatus} onValueChange={(val) => setActiveStatus(val as HubResourceStatus)}>
                        <TabsList className="bg-muted/50 p-1 h-auto mb-6">
                            <TabsTrigger value="pending" className="px-6 py-2">Pendentes</TabsTrigger>
                            <TabsTrigger value="published" className="px-6 py-2">Publicados</TabsTrigger>
                            <TabsTrigger value="archived" className="px-6 py-2">Arquivados</TabsTrigger>
                            <TabsTrigger value="rejected" className="px-6 py-2">Recusados</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeStatus} className="mt-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Carregando recursos...</p>
                                </div>
                            ) : resources.length === 0 ? (
                                <Card className="border-dashed border-2 py-20">
                                    <CardContent className="flex flex-col items-center justify-center">
                                        <div className="bg-muted p-4 rounded-full mb-4">
                                            <Archive className="h-10 w-10 text-muted-foreground opacity-50" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Nenhum item nesta categoria</h3>
                                        <p className="text-muted-foreground">Tudo em dia por aqui!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-8">
                                    {resources.map((res) => (
                                        <HubModerationCard 
                                            key={res.id} 
                                            resource={res} 
                                            onAction={handleAction}
                                            isProcessing={processingId === res.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </RequireRole>
    )
}

function HubModerationCard({ resource, onAction, isProcessing }: { 
    resource: HubResource, 
    onAction: (id: string, status: HubResourceStatus, data: any) => void,
    isProcessing: boolean 
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageUpload = useSimpleImageUpload('/api/upload/hub-resource')

    const [editData, setEditData] = useState({
        title: resource.title,
        url: resource.url,
        description: resource.description || "",
        badge_text: resource.badge_text || "",
        is_affiliate: resource.is_affiliate,
        image_url: resource.image_url || "",
        address: resource.address || "",
        location_url: resource.location_url || "",
        event_date: resource.event_date || "",
        event_time: resource.event_time || ""
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

    const isPublished = resource.status === 'published'

    return (
        <Card className={`overflow-hidden border-2 transition-all ${isPublished ? 'border-green-100 hover:border-green-200' : 'border-yellow-100'}`}>
            <CardHeader className="bg-muted/30 border-b py-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Badge variant={isPublished ? "default" : "secondary"}>
                            {resource.type.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {isPublished ? "Item no Ar" : "Aguardando Revisão"}
                        </span>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {!isPublished && (
                            <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => onAction(resource.id, 'rejected', {})}
                                disabled={isProcessing}
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> Recusar
                            </Button>
                        )}
                        {resource.status !== 'archived' && isPublished && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onAction(resource.id, 'archived', {})}
                                disabled={isProcessing}
                            >
                                <Archive className="h-4 w-4 mr-1" /> Arquivar
                            </Button>
                        )}
                        <Button 
                            className={`${isPublished ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} min-w-[120px]`}
                            size="sm"
                            onClick={() => onAction(resource.id, 'published', editData)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <><Save className="h-4 w-4 mr-1" /> {isPublished ? "Atualizar Dados" : "Aprovar e Publicar"}</>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Imagem */}
                    <div className="space-y-4">
                        <Label className="font-bold text-[10px] uppercase text-muted-foreground">Imagem de Capa</Label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-video border-2 border-dashed rounded-lg overflow-hidden relative cursor-pointer group"
                        >
                            {editData.image_url ? (
                                <img src={editData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-muted/50">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-[10px] mt-1">Upload</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                Trocar Imagem
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">Selo (Badge)</Label>
                            <Input 
                                value={editData.badge_text} 
                                onChange={e => setEditData({...editData, badge_text: e.target.value})}
                                placeholder="Ex: Cupom: TECH20"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                            <input 
                                type="checkbox" 
                                id={`aff-${resource.id}`}
                                checked={editData.is_affiliate}
                                onChange={e => setEditData({...editData, is_affiliate: e.target.checked})}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <Label htmlFor={`aff-${resource.id}`} className="text-xs font-semibold cursor-pointer">Link de Parceiro</Label>
                        </div>
                    </div>

                    {/* Dados */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold">Título</Label>
                                <Input 
                                    value={editData.title} 
                                    onChange={e => setEditData({...editData, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold flex justify-between">
                                    Link Principal
                                    <a href={resource.url} target="_blank" rel="noopener" className="text-blue-500 flex items-center">Abrir Original <ExternalLink className="h-2 w-2 ml-0.5" /></a>
                                </Label>
                                <Input 
                                    value={editData.url} 
                                    onChange={e => setEditData({...editData, url: e.target.value})}
                                    className="bg-blue-50/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">Descrição</Label>
                            <Textarea 
                                value={editData.description} 
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                className="min-h-[80px] text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold flex items-center gap-1"><MapPin className="h-3 w-3" /> Localização</Label>
                                    <Input 
                                        value={editData.address} 
                                        onChange={e => setEditData({...editData, address: e.target.value})}
                                        placeholder="Ex: Online (Zoom)"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Link Maps</Label>
                                    <Input 
                                        value={editData.location_url} 
                                        onChange={e => setEditData({...editData, location_url: e.target.value})}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</Label>
                                    <Input 
                                        type="date"
                                        value={editData.event_date} 
                                        onChange={e => setEditData({...editData, event_date: e.target.value})}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> Horário</Label>
                                    <Input 
                                        type="time"
                                        value={editData.event_time} 
                                        onChange={e => setEditData({...editData, event_time: e.target.value})}
                                        className="h-8 text-sm"
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
