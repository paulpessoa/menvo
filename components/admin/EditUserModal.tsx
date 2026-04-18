"use client"

import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Save, Trash2, Shield, User, Star, Camera, Upload } from "lucide-react"

import { adminService, type AdminUserUpdate } from "@/services/admin/admin"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"
import { toast } from "sonner"

interface EditUserModalProps {
    user: any | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function EditUserModal({ user, isOpen, onClose, onSuccess }: EditUserModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<AdminUserUpdate>({})
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [notifyEmail, setNotifyEmail] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Hook de upload (como administrador, podemos enviar para o path do usuário)
    const imageUpload = useSimpleImageUpload('/api/upload/profile-photo')

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                bio: user.bio || "",
                avatar_url: user.avatar_url || "",
                verified: user.verified || false,
                verification_notes: user.verification_notes || "",
                is_public: user.is_public || false
            })
            setSelectedRoles(user.roles || [])
        }
    }, [user])

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !user) return

        // Nota: O endpoint de upload atual usa a sessão do usuário logado.
        // Se quisermos que o Admin envie fotos para OUTRO usuário, precisamos de um endpoint Admin ou passar o targetUserId.
        // Por agora, vou manter a edição de URL mas adicionar um disclaimer ou tentar o upload.
        const result = await imageUpload.upload(file)

        if (result.success) {
            const avatarUrl = result.data.url + '?t=' + Date.now()
            setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
            toast.success("Foto enviada com sucesso!")
        } else {
            toast.error("Erro no upload: " + (result.error || "Tente novamente"))
        }
    }

    const handleSave = async () => {
        if (!user) return
        setLoading(true)
        try {
            // 1. Atualizar Perfil
            await adminService.updateUserProfile(user.id, formData)
            
            // 2. Atualizar Roles
            await adminService.setUserRoles(user.id, selectedRoles)

            // 3. Notificar por E-mail se solicitado
            if (notifyEmail && (formData.verified !== user.verified || formData.verification_notes !== user.verification_notes)) {
                await fetch('/api/admin/notify-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        status: formData.verified ? 'approved' : 'rejected',
                        notes: formData.verification_notes
                    })
                })
            }

            toast.success("Usuário atualizado com sucesso!")
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error("Error updating user:", error)
            toast.error("Erro ao atualizar: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleRole = (role: string) => {
        setSelectedRoles(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        )
    }

    if (!user) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <Shield className="h-6 w-6" /> Moderação de Perfil
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Gerencie os dados e permissões de <strong>{user.email}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-8 py-6">
                    {/* Avatar e Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-muted/20 rounded-xl border border-dashed">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                                <AvatarImage src={formData.avatar_url} />
                                <AvatarFallback className="text-2xl">{user.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Camera className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Foto de Perfil</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={formData.avatar_url} 
                                    onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                                    placeholder="URL da imagem..."
                                    className="flex-1"
                                />
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={imageUpload.isUploading}
                                >
                                    {imageUpload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                </Button>
                            </div>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                            <p className="text-[10px] text-muted-foreground italic">Dica: Você pode colar uma URL ou fazer o upload de um arquivo.</p>
                        </div>
                    </div>

                    {/* Dados Básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className="font-bold">Nome</Label>
                            <Input 
                                id="first_name" 
                                value={formData.first_name} 
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name" className="font-bold">Sobrenome</Label>
                            <Input 
                                id="last_name" 
                                value={formData.last_name} 
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="font-bold">Biografia / Descrição Pública</Label>
                        <Textarea 
                            id="bio" 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            rows={4}
                            className="bg-white"
                        />
                    </div>

                    {/* Roles Management */}
                    <div className="space-y-4 p-5 border-2 rounded-xl bg-blue-50/30 border-blue-100">
                        <Label className="text-base font-bold flex items-center gap-2 text-blue-900">
                            <User className="h-5 w-5" /> Papéis e Atribuições (Roles)
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleRole('mentee')}>
                                <Checkbox 
                                    id="role-mentee" 
                                    checked={selectedRoles.includes('mentee')}
                                />
                                <Label htmlFor="role-mentee" className="cursor-pointer font-medium">Mentee</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleRole('mentor')}>
                                <Checkbox 
                                    id="role-mentor" 
                                    checked={selectedRoles.includes('mentor')}
                                />
                                <Label htmlFor="role-mentor" className="cursor-pointer font-medium">Mentor</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border-2 border-red-100 shadow-sm cursor-pointer hover:bg-red-50 transition-colors" onClick={() => toggleRole('admin')}>
                                <Checkbox 
                                    id="role-admin" 
                                    checked={selectedRoles.includes('admin')}
                                />
                                <Label htmlFor="role-admin" className="cursor-pointer font-bold text-red-700">Administrador</Label>
                            </div>
                        </div>
                        <p className="text-[11px] text-blue-700 italic flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Alterar papéis concede ou remove acesso a áreas privadas instantaneamente.
                        </p>
                    </div>

                    {/* Verificação */}
                    <div className="space-y-4 p-5 border-2 rounded-xl border-yellow-200 bg-yellow-50/50">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold flex items-center gap-2 text-yellow-900">
                                <Star className="h-5 w-5 text-yellow-600 fill-current" /> Verificação Oficial Menvo
                            </Label>
                            <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-yellow-200">
                                <Checkbox 
                                    id="verified" 
                                    checked={formData.verified}
                                    onCheckedChange={(checked) => setFormData({...formData, verified: checked as boolean})}
                                />
                                <Label htmlFor="verified" className="font-bold text-green-700 cursor-pointer">VERIFICADO / ATIVO</Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="verification_notes" className="font-semibold">Notas e Feedback (O usuário verá esta mensagem)</Label>
                            <Textarea 
                                id="verification_notes" 
                                value={formData.verification_notes} 
                                onChange={e => setFormData({...formData, verification_notes: e.target.value})}
                                placeholder="Explique por que aprovou ou aponte o que falta para a aprovação (ex: 'Sua foto está desfocada', 'Adicione seu LinkedIn')..."
                                className="bg-white min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Notificação checkbox */}
                    <div className="flex items-center space-x-3 px-2 py-3 bg-muted/30 rounded-lg">
                        <Checkbox 
                            id="notify-email" 
                            checked={notifyEmail}
                            onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                        />
                        <Label htmlFor="notify-email" className="text-sm font-bold text-gray-700 cursor-pointer">
                            Enviar aviso automático por e-mail para o usuário (Brevo)
                        </Label>
                    </div>
                </div>

                <DialogFooter className="border-t pt-6 gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="px-8">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="px-8 bg-primary hover:bg-primary/90">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar e Aplicar Alterações</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
