"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Users, 
  GraduationCap, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  Save,
  Edit2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Trash2,
  Camera
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { Organization, OrganizationStatus, OrganizationType } from "@/lib/types/organizations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"

export default function AdminOrganizationDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Hook de upload especializado para organizações
    const logoUpload = useSimpleImageUpload(`/api/upload/organization-logo?orgId=${id}`)

    // Form state
    const [formData, setFormData] = useState<Partial<Organization>>({})

    useEffect(() => {
        if (id) {
            fetchOrganization()
        }
    }, [id])

    const fetchOrganization = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/organizations/${id}`)
            if (response.ok) {
                const result = await response.json()
                const org = result.data.organization
                setOrganization(org)
                setStats(result.data.stats)
                setFormData({
                    name: org.name,
                    description: org.description,
                    website: org.website,
                    contact_email: org.contact_email,
                    contact_phone: org.contact_phone,
                    type: org.type,
                    logo_url: org.logo_url,
                    status: org.status
                })
            } else {
                toast.error("Erro ao carregar organização")
            }
        } catch (err) {
            console.error("Error fetching organization:", err)
            toast.error("Erro de conexão ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const result = await logoUpload.upload(file)

        if (result.success) {
            const newLogoUrl = result.data.url + '?t=' + Date.now()
            setFormData(prev => ({ ...prev, logo_url: newLogoUrl }))
            
            // Se não estiver em modo edição, salvar logo imediatamente
            if (!isEditing) {
                await updateOrganizationField({ logo_url: newLogoUrl })
            }
            
            toast.success("Logo atualizada com sucesso")
            fetchOrganization()
        } else {
            toast.error(result.error || "Erro ao fazer upload da logo")
        }
    }

    const updateOrganizationField = async (fields: Partial<Organization>) => {
        try {
            const response = await fetch(`/api/admin/organizations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fields)
            })
            return response.ok
        } catch (err) {
            return false
        }
    }

    const handleUpdateStatus = async (newStatus: OrganizationStatus) => {
        if (!confirm(`Mudar status para ${newStatus}?`)) return

        setActionLoading(true)
        try {
            const response = await fetch(`/api/admin/organizations/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })
            
            if (response.ok) {
                toast.success("Status atualizado com sucesso")
                fetchOrganization()
            } else {
                toast.error("Erro ao atualizar status")
            }
        } catch (err) {
            console.error("Error updating status:", err)
            toast.error("Erro de conexão ao atualizar status")
        } finally {
            setActionLoading(false)
        }
    }

    const handleSaveChanges = async () => {
        setIsSaving(true)
        try {
            const response = await fetch(`/api/admin/organizations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            
            if (response.ok) {
                toast.success("Organização atualizada com sucesso")
                setIsEditing(false)
                fetchOrganization()
            } else {
                toast.error("Erro ao salvar alterações")
            }
        } catch (err) {
            console.error("Error saving organization:", err)
            toast.error("Erro de conexão ao salvar alterações")
        } finally {
            setIsSaving(false)
        }
    }

    const getStatusBadge = (status: OrganizationStatus) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Ativa</Badge>
            case "pending_approval":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Pendente</Badge>
            case "suspended":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Suspensa</Badge>
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Inativa</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Carregando detalhes da organização...</p>
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold">Organização não encontrada</h3>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard/admin/organizations">Voltar para a lista</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/dashboard/admin/organizations"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para lista
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                        {getStatusBadge(organization.status)}
                    </div>
                    <p className="text-muted-foreground">ID: {organization.id}</p>
                </div>
                
                <div className="flex items-center gap-2">
                    {!isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                                <Edit2 className="w-4 h-4" /> Editar
                            </Button>
                            
                            {organization.status === "pending_approval" && (
                                <Button onClick={() => handleUpdateStatus("active")} className="bg-green-600 hover:bg-green-700 gap-2">
                                    <CheckCircle className="w-4 h-4" /> Aprovar
                                </Button>
                            )}
                            
                            {organization.status === "active" && (
                                <Button variant="destructive" onClick={() => handleUpdateStatus("suspended")} className="gap-2">
                                    <XCircle className="w-4 h-4" /> Suspender
                                </Button>
                            )}

                            {organization.status === "suspended" && (
                                <Button onClick={() => handleUpdateStatus("active")} className="bg-green-600 hover:bg-green-700 gap-2">
                                    <CheckCircle className="w-4 h-4" /> Reativar
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSaveChanges} disabled={isSaving} className="gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Alterações
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Principais</CardTitle>
                            <CardDescription>Informações básicas e de contato da organização</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome da Organização</label>
                                    <Input 
                                        value={formData.name || ""} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo</label>
                                    <Select 
                                        value={formData.type} 
                                        onValueChange={(val: OrganizationType) => setFormData({...formData, type: val})}
                                        disabled={!isEditing}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="company">Empresa</SelectItem>
                                            <SelectItem value="ngo">ONG / Social</SelectItem>
                                            <SelectItem value="community">Comunidade</SelectItem>
                                            <SelectItem value="hackathon">Hackathon</SelectItem>
                                            <SelectItem value="sebrae">Sebrae</SelectItem>
                                            <SelectItem value="other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descrição</label>
                                <Textarea 
                                    value={formData.description || ""} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    disabled={!isEditing}
                                    rows={4}
                                    placeholder="Descreva o propósito da organização..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Logo URL (ou upload ao lado)</label>
                                    <Input 
                                        value={formData.logo_url || ""} 
                                        onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Website</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={formData.website || ""} 
                                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                                            disabled={!isEditing}
                                            placeholder="www.exemplo.com"
                                        />
                                        {formData.website && !isEditing && (
                                            <Button variant="outline" size="icon" asChild>
                                                <a href={formData.website} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email de Contato</label>
                                    <Input 
                                        value={formData.contact_email || ""} 
                                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Telefone de Contato</label>
                                    <Input 
                                        value={formData.contact_phone || ""} 
                                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta Data */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações de Sistema</CardTitle>
                            <CardDescription>Prazos e metadados administrativos</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Data de Criação</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(organization.created_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Última Atualização</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(organization.updated_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            {organization.approved_at && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium">Aprovado em</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(organization.approved_at).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg text-center">Identidade Visual</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center py-6">
                            <div className="relative group">
                                {formData.logo_url ? (
                                    <img 
                                        src={formData.logo_url} 
                                        alt={organization.name} 
                                        className="w-32 h-32 rounded-xl object-contain bg-white p-2 shadow-sm border mb-4" 
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-xl bg-primary/10 flex items-center justify-center mb-4 border-2 border-dashed border-primary/20">
                                        <Building2 className="w-16 h-16 text-primary/40" />
                                    </div>
                                )}
                                
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                                    disabled={logoUpload.isUploading}
                                    title="Mudar logo"
                                >
                                    {logoUpload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                </button>
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleLogoUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            <h3 className="font-bold text-xl text-center mt-2">{organization.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4 capitalize">{organization.type}</p>
                            <Badge variant="outline" className="font-mono text-[10px]">{organization.slug}</Badge>
                            
                            {logoUpload.isUploading && (
                                <p className="text-[10px] text-primary animate-pulse mt-2">Fazendo upload...</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Métricas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Mentores</span>
                                </div>
                                <span className="font-bold">{stats?.mentors || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Mentees</span>
                                </div>
                                <span className="font-bold">{stats?.mentees || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm">Sessões</span>
                                </div>
                                <span className="font-bold">{stats?.sessions || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100">
                        <CardHeader>
                            <CardTitle className="text-lg text-red-600">Zona de Perigo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-4">
                                A remoção de uma organização é uma ação definitiva e pode afetar mentores e alunos vinculados.
                            </p>
                            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2">
                                <Trash2 className="w-4 h-4" /> Deletar Organização
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Building2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
      <path d="M15 2H9" />
    </svg>
  )
}
