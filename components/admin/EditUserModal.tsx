"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Save, Trash2, Shield, User, Star } from "lucide-react"
import { adminService, type AdminUserUpdate } from "@/services/admin/admin"
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

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                full_name: user.full_name || "",
                bio: user.bio || "",
                avatar_url: user.avatar_url || "",
                verified: user.verified || false,
                verification_notes: user.verification_notes || ""
            })
            setSelectedRoles(user.roles || [])
        }
    }, [user])

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

            toast.success("Usuário atualizado e notificado!")
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Shield className="h-6 w-6 text-primary" /> Editar Usuário
                    </DialogTitle>
                    <DialogDescription>
                        Modere as informações e gerencie as permissões de {user.email}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Avatar e Nome */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarImage src={formData.avatar_url} />
                            <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 grid gap-2">
                            <Label htmlFor="avatar_url">URL da Foto de Perfil</Label>
                            <Input 
                                id="avatar_url" 
                                value={formData.avatar_url} 
                                onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                                placeholder="https://..."
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">Nome</Label>
                            <Input 
                                id="first_name" 
                                value={formData.first_name} 
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Sobrenome</Label>
                            <Input 
                                id="last_name" 
                                value={formData.last_name} 
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Biografia / Sobre</Label>
                        <Textarea 
                            id="bio" 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            rows={4}
                        />
                    </div>

                    {/* Roles Management */}
                    <div className="space-y-3 p-4 border rounded-lg bg-primary/5">
                        <Label className="text-base font-bold flex items-center gap-2">
                            <User className="h-4 w-4" /> Papéis no Sistema (Roles)
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="role-mentee" 
                                    checked={selectedRoles.includes('mentee')}
                                    onCheckedChange={() => toggleRole('mentee')}
                                />
                                <Label htmlFor="role-mentee" className="cursor-pointer">Mentee</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="role-mentor" 
                                    checked={selectedRoles.includes('mentor')}
                                    onCheckedChange={() => toggleRole('role-mentor')}
                                />
                                <Label htmlFor="role-mentor" className="cursor-pointer">Mentor</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="role-admin" 
                                    checked={selectedRoles.includes('admin')}
                                    onCheckedChange={() => toggleRole('admin')}
                                />
                                <Label htmlFor="role-admin" className="cursor-pointer font-bold text-red-600">Admin</Label>
                            </div>
                        </div>
                    </div>

                    {/* Verificação */}
                    <div className="space-y-4 p-4 border rounded-lg border-yellow-200 bg-yellow-50/50">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-600" /> Verificação de Mentor
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="verified" 
                                    checked={formData.verified}
                                    onCheckedChange={(checked) => setFormData({...formData, verified: checked as boolean})}
                                />
                                <Label htmlFor="verified" className="font-semibold text-green-700">Verificado / Ativo</Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="verification_notes">Notas de Verificação (Visível ao Usuário)</Label>
                            <Textarea 
                                id="verification_notes" 
                                value={formData.verification_notes} 
                                onChange={e => setFormData({...formData, verification_notes: e.target.value})}
                                placeholder="Explique por que aprovou ou o que falta para aprovar..."
                                className="bg-white"
                            />
                        </div>
                    </div>

                    {/* Notificação checkbox */}
                    <div className="flex items-center space-x-2 px-1">
                        <Checkbox 
                            id="notify-email" 
                            checked={notifyEmail}
                            onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                        />
                        <Label htmlFor="notify-email" className="text-sm font-medium text-muted-foreground">
                            Enviar notificação por e-mail para o usuário (Brevo)
                        </Label>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
