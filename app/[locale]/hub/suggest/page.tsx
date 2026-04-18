"use client"

import { useState, useRef } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Loader2, Link as LinkIcon, Send, MapPin, Calendar, Clock, Camera, Upload } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { hubService, type HubResourceType } from "@/services/hub/hub"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"
import { toast } from "sonner"

export default function HubSuggestPage() {
    const t = useTranslations("hub")
    const common = useTranslations("common")
    const router = useRouter()
    const { user } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    
    // Novo hook focado apenas no upload do HUB
    const hubImageUpload = useSimpleImageUpload('/api/upload/hub-resource')

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "event" as HubResourceType,
        url: "",
        badge_text: "",
        image_url: "",
        address: "",
        location_url: "",
        event_date: "",
        event_time: ""
    })

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const result = await hubImageUpload.upload(file)

        if (result.success) {
            setFormData(prev => ({ ...prev, image_url: result.data.url }))
            toast.success("Imagem carregada com sucesso!")
        } else {
            toast.error(result.error || "Erro no upload da imagem")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("Você precisa estar logado para sugerir um recurso.")
            router.push("/login")
            return
        }

        setLoading(true)
        try {
            await hubService.suggestResource({
                ...formData,
                user_id: user.id,
                event_date: formData.event_date || null,
                event_time: formData.event_time || null
            } as any)
            
            setSubmitted(true)
            toast.success("Sugestão enviada com sucesso!")
        } catch (error) {
            console.error('Error suggesting resource:', error)
            toast.error("Erro ao salvar sua sugestão. Verifique os dados e tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="container mx-auto px-4 py-24 flex items-center justify-center">
                <Card className="max-w-md w-full text-center p-6 border-2 border-green-100 bg-green-50/30 shadow-xl">
                    <CardHeader>
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl">Obrigado pela sugestão!</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Recebemos seu link. Nossa equipe vai revisar e publicar em breve!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full">
                            <Link href="/hub">Voltar para o Hub</Link>
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => setSubmitted(false)}>
                            Sugerir outro link
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/hub">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
                    </Link>
                </Button>

                <div className="space-y-2 text-center md:text-left">
                    <h1 className="text-3xl font-bold tracking-tight">Sugerir no Menvo Hub</h1>
                    <p className="text-muted-foreground text-lg">
                        Compartilhe eventos, ferramentas ou oportunidades com a comunidade.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Imagem de Capa */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Camera className="h-5 w-5" /> Imagem de Capa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden"
                            >
                                {formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} alt="Capa" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white">
                                            Trocar Imagem
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">Clique para fazer upload</p>
                                        <p className="text-xs text-muted-foreground mt-1">Formatos sugeridos: JPG, PNG (Max 2MB)</p>
                                    </>
                                )}
                                {hubImageUpload.isUploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </CardContent>
                    </Card>

                    {/* Informações Básicas */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Detalhes do Recurso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="url">Link Externo (Site, Inscrição ou Afiliado)</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="url" 
                                        type="url" 
                                        placeholder="https://..." 
                                        className="pl-10"
                                        required
                                        value={formData.url}
                                        onChange={(e) => setFormData({...formData, url: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input 
                                        id="title" 
                                        placeholder="Ex: Workshop de React" 
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo</Label>
                                    <Select 
                                        value={formData.type} 
                                        onValueChange={(val: HubResourceType) => setFormData({...formData, type: val})}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="event">Evento</SelectItem>
                                            <SelectItem value="course">Curso</SelectItem>
                                            <SelectItem value="tool">Ferramenta</SelectItem>
                                            <SelectItem value="discount">Desconto</SelectItem>
                                            <SelectItem value="job">Vaga</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Conte mais sobre este recurso..." 
                                    className="min-h-[100px]"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Localização e Data (Opcionais) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Localização e Data <Badge variant="outline" className="font-normal text-[10px]">Opcional</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço ou Plataforma (Ex: Zoom, São Paulo, Online)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="address" 
                                        placeholder="Ex: Av. Paulista ou Online" 
                                        className="pl-10"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location_url">Link do Maps (Opcional)</Label>
                                <Input 
                                    id="location_url" 
                                    placeholder="Cole o link do Google Maps aqui..." 
                                    value={formData.location_url}
                                    onChange={(e) => setFormData({...formData, location_url: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Data</Label>
                                    <Input 
                                        type="date" 
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Horário</Label>
                                    <Input 
                                        type="time" 
                                        value={formData.event_time}
                                        onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <CardFooter className="px-0">
                        <Button type="submit" className="w-full h-12 text-lg shadow-lg" disabled={loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</>
                            ) : (
                                <><Send className="mr-2 h-5 w-5" /> Enviar para Revisão</>
                            )}
                        </Button>
                    </CardFooter>
                </form>

                <p className="text-center text-xs text-muted-foreground">
                    Ao sugerir um recurso, você colabora com o crescimento da nossa comunidade.
                </p>
            </div>
        </div>
    )
}
