'use client'

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Database } from '@/types/database'
import { Loader2Icon } from 'lucide-react'
import { getAdminUsers, updateAdminUser } from '@/services/auth/supabase' // Using client-side supabase for admin actions
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle, XCircle, Eye, Mail, Phone, LinkIcon, MapPin, Briefcase, GraduationCap, Languages, Star } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useValidatedMentors } from '@/hooks/useValidatedMentors'
import { useTranslation } from "react-i18next"

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface MentorVerification {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  bio?: string
  current_position?: string
  current_company?: string
  years_experience?: number
  education_level?: string
  languages?: string[]
  skills?: string[]
  linkedin_url?: string
  portfolio_url?: string
  proof_of_experience_url?: string // URL to a document/image proving experience
}

export default function AdminVerificationsPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const { data: verifications, isLoading, error, approveMentor, rejectMentor } = useValidatedMentors()

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [selectedVerification, setSelectedVerification] = useState<MentorVerification | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== "admin")) {
      router.push("/unauthorized")
    }
  }, [user, authLoading, router])

  const handleApprove = async (id: string) => {
    setIsProcessing(true)
    try {
      await approveMentor(id)
      toast({
        title: "Mentor Aprovado",
        description: "O mentor foi aprovado e seu perfil está agora ativo.",
        variant: "default",
      })
      setSelectedVerification(null)
    } catch (err: any) {
      toast({
        title: "Erro ao Aprovar",
        description: err.message || "Não foi possível aprovar o mentor.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (id: string) => {
    setIsProcessing(true)
    try {
      await rejectMentor(id)
      toast({
        title: "Mentor Rejeitado",
        description: "O mentor foi rejeitado e seu perfil não está ativo.",
        variant: "default",
      })
      setSelectedVerification(null)
    } catch (err: any) {
      toast({
        title: "Erro ao Rejeitar",
        description: err.message || "Não foi possível rejeitar o mentor.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (authLoading || (user && user.user_metadata?.role !== "admin" && !isLoading)) {
    return null // Redirect handled by useEffect
  }

  if (isLoading) {
    return (
      <div className="container py-8 md:py-12 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando verificações...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8 md:py-12 text-center text-red-500">
        <p>Erro ao carregar verificações: {error.message}</p>
      </div>
    )
  }

  const filteredVerifications = verifications?.filter(v => v.status === activeTab) || []

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container py-8 md:py-12">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Verificações</h1>
            <p className="text-muted-foreground">Revise e gerencie as solicitações de verificação de mentores.</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pending" | "approved" | "rejected")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pendentes ({verifications?.filter(v => v.status === 'pending').length || 0})</TabsTrigger>
              <TabsTrigger value="approved">Aprovados ({verifications?.filter(v => v.status === 'approved').length || 0})</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados ({verifications?.filter(v => v.status === 'rejected').length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t(`admin.verifications.tabs.${activeTab}.title`)}</CardTitle>
                  <CardDescription>{t(`admin.verifications.tabs.${activeTab}.description`)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredVerifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma solicitação {activeTab === 'pending' ? 'pendente' : activeTab === 'approved' ? 'aprovada' : 'rejeitada'} no momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredVerifications.map((verification) => (
                        <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={verification.avatar_url || "/placeholder-user.jpg"} alt={verification.full_name} />
                              <AvatarFallback>{verification.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{verification.full_name}</h4>
                              <p className="text-sm text-muted-foreground">{verification.email}</p>
                              <p className="text-xs text-muted-foreground">Enviado em: {new Date(verification.submitted_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(verification.status)}
                            <Button size="sm" variant="outline" onClick={() => setSelectedVerification(verification)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Details Modal */}
        {selectedVerification && (
          <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes da Verificação de Mentor</DialogTitle>
                <DialogDescription>
                  Revise as informações enviadas por {selectedVerification.full_name}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedVerification.avatar_url || "/placeholder-user.jpg"} alt={selectedVerification.full_name} />
                    <AvatarFallback className="text-xl">{selectedVerification.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedVerification.full_name}</h3>
                    <p className="text-muted-foreground">{selectedVerification.email}</p>
                    <Badge variant="outline" className="mt-1">{selectedVerification.status}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> Experiência Profissional</h4>
                  <p className="text-muted-foreground">
                    {selectedVerification.current_position} {selectedVerification.current_company && `na ${selectedVerification.current_company}`}
                  </p>
                  {selectedVerification.years_experience && (
                    <p className="text-sm text-muted-foreground">{selectedVerification.years_experience} anos de experiência</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Educação</h4>
                  <p className="text-muted-foreground">{selectedVerification.education_level || "Não informado"}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Star className="h-4 w-4" /> Habilidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVerification.skills && selectedVerification.skills.length > 0 ? (
                      selectedVerification.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhuma habilidade informada.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Languages className="h-4 w-4" /> Idiomas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVerification.languages && selectedVerification.languages.length > 0 ? (
                      selectedVerification.languages.map(lang => <Badge key={lang} variant="outline">{lang}</Badge>)
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum idioma informado.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Links</h4>
                  {selectedVerification.linkedin_url && (
                    <p className="text-muted-foreground text-sm">LinkedIn: <a href={selectedVerification.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedVerification.linkedin_url}</a></p>
                  )}
                  {selectedVerification.portfolio_url && (
                    <p className="text-muted-foreground text-sm">Portfólio: <a href={selectedVerification.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedVerification.portfolio_url}</a></p>
                  )}
                  {!selectedVerification.linkedin_url && !selectedVerification.portfolio_url && (
                    <p className="text-muted-foreground text-sm">Nenhum link fornecido.</p>
                  )}
                </div>

                {selectedVerification.proof_of_experience_url && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2"><Eye className="h-4 w-4" /> Comprovante de Experiência</h4>
                    <a href={selectedVerification.proof_of_experience_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">Ver Comprovante</Button>
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Mail className="h-4 w-4" /> Contato</h4>
                  <p className="text-muted-foreground text-sm">E-mail: {selectedVerification.email}</p>
                  {/* Add phone if available */}
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                {selectedVerification.status === "pending" && (
                  <>
                    <Button variant="outline" onClick={() => handleReject(selectedVerification.id)} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Rejeitar
                    </Button>
                    <Button onClick={() => handleApprove(selectedVerification.id)} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Aprovar
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={() => setSelectedVerification(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  )
}
