"use client"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Loader2, Link as LinkIcon, Send } from "lucide-react"
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
    
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "event" as HubResourceType,
        url: "",
        badge_text: ""
    })

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
                image_url: null
            })
            setSubmitted(true)
            toast.success("Sugestão enviada com sucesso!")
        } catch (error) {
            console.error('Error suggesting resource:', error)
            toast.error("Erro ao enviar sugestão. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="container mx-auto px-4 py-24 flex items-center justify-center">
                <Card className="max-w-md w-full text-center p-6 border-2 border-green-100 bg-green-50/30">
                    <CardHeader>
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl">Obrigado pela sugestão!</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Recebemos seu link. Nossa equipe (o Paulo!) vai revisar e publicar em breve se estiver tudo certo.
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
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/hub">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
                    </Link>
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Sugerir no Menvo Hub</h1>
                    <p className="text-muted-foreground">
                        Encontrou algo incrível? Compartilhe com a nossa comunidade de mentores e mentees.
                    </p>
                </div>

                <Card className="border-2">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle className="text-lg">Detalhes do Recurso</CardTitle>
                            <CardDescription>
                                Preencha as informações básicas. Nós cuidaremos do resto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="url">Link Externo (URL)</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="url" 
                                        type="url" 
                                        placeholder="https://exemplo.com/evento-ou-curso" 
                                        className="pl-10"
                                        required
                                        value={formData.url}
                                        onChange={(e) => setFormData({...formData, url: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <Label htmlFor="description">Descrição Curta</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Explique brevemente por que isso é útil para a comunidade..." 
                                    className="min-h-[100px]"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="badge">Texto do Selo (Opcional)</Label>
                                <Input 
                                    id="badge" 
                                    placeholder="Ex: Grátis, Cupom: TECH10, Inscrições Abertas" 
                                    value={formData.badge_text}
                                    onChange={(e) => setFormData({...formData, badge_text: e.target.value})}
                                />
                                <p className="text-[11px] text-muted-foreground italic">
                                    Destaque uma informação importante no card.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 pt-6">
                            <Button type="submit" className="w-full shadow-md" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Enviar Sugestão</>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-xs text-muted-foreground px-8">
                    Ao sugerir um recurso, você concorda que nossa equipe pode editar as informações antes da publicação final.
                </p>
            </div>
        </div>
    )
}
