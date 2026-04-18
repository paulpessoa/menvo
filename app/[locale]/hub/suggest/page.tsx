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
import { ArrowLeft, CheckCircle2, Loader2, Link as LinkIcon, Send, MapPin, Calendar, Clock, Camera, Upload, X } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { hubService, type HubResourceType } from "@/services/hub/hub"
import { toast } from "sonner"

export default function HubSuggestPage() {
    const t = useTranslations("hub")
    const common = useTranslations("common")
    const router = useRouter()
    const { user } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    
    // Estado local para o arquivo (não sobe para o storage imediatamente)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "event" as HubResourceType,
        url: "",
        badge_text: "",
        address: "",
        location_url: "",
        event_date: "",
        event_time: ""
    })

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validar tamanho (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 2MB.")
            return
        }

        setSelectedFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const removeFile = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const uploadImage = async (): Promise<string | null> => {
        if (!selectedFile) return null

        const uploadData = new FormData()
        uploadData.append("file", selectedFile)

        const response = await fetch('/api/upload/hub-resource', {
            method: 'POST',
            body: uploadData
        })

        if (!response.ok) throw new Error("Falha no upload da imagem")
        const data = await response.json()
        return data.url
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
            // 1. Upload da imagem APENAS AGORA
            let finalImageUrl = null
            if (selectedFile) {
                finalImageUrl = await uploadImage()
            }

            // 2. Salvar no Banco
            await hubService.suggestResource({
                ...formData,
                image_url: finalImageUrl,
                user_id: user.id,
                event_date: formData.event_date || null,
                event_time: formData.event_time || null
            } as any)
            
            setSubmitted(true)
            toast.success("Sugestão enviada com sucesso!")
        } catch (error) {
            console.error('Error suggesting resource:', error)
            toast.error("Erro ao salvar sua sugestão. Tente novamente.")
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
                        <Button variant="ghost" className="w-full" onClick={() => {
                            setSubmitted(false)
                            setSelectedFile(null)
                            setPreviewUrl(null)
                            setFormData({
                                title: "",
                                description: "",
                                type: "event" as HubResourceType,
                                url: "",
                                badge_text: "",
                                address: "",
                                location_url: "",
                                event_date: "",
                                event_time: ""
                            })
                        }}>
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
                                onClick={() => !previewUrl && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-colors relative overflow-hidden ${
                                    previewUrl ? 'border-primary/20 bg-primary/5' : 'bg-muted/30 hover:bg-muted/50 cursor-pointer'
                                }`}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 text-center backdrop-blur-sm">
                                            A imagem será salva ao enviar o formulário
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">Clique para selecionar imagem</p>
                                        <p className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG (Max 2MB)</p>
                                    </>
                                )}
                            </div>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </CardContent>
                    </Card>

                    {/* Informações Básicas */}
                    <Card className="border-2 shadow-sm">
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
                                        className="pl-10 h-11"
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
                                        placeholder="Ex: Workshop de Next.js" 
                                        className="h-11"
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
                                        <SelectTrigger id="type" className="h-11">
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
                                    className="min-h-[120px] resize-none"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Localização e Data (Opcionais) */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Localização e Data <Badge variant="secondary" className="font-normal text-[10px]">Opcional</Badge>
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
                                        className="pl-10 h-11"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location_url">Link do Maps</Label>
                                <Input 
                                    id="location_url" 
                                    placeholder="Cole o link do Google Maps aqui..." 
                                    className="h-11"
                                    value={formData.location_url}
                                    onChange={(e) => setFormData({...formData, location_url: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Data</Label>
                                    <Input 
                                        type="date" 
                                        className="h-11"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Horário</Label>
                                    <Input 
                                        type="time" 
                                        className="h-11"
                                        value={formData.event_time}
                                        onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <CardFooter className="px-0">
                        <Button type="submit" className="w-full h-14 text-lg shadow-xl hover:scale-[1.01] transition-transform" disabled={loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Processando...</>
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
