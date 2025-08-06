"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Mail, Plus, Edit, Trash2, Send, Eye } from 'lucide-react'
import { useNewsletter } from "@/hooks/useNewsletter"
import { useToast } from "@/hooks/useToast"
import { NewsletterSubscriber, NewsletterCampaign } from "@/types/database"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function NewsletterDashboard() {
  const {
    subscribers,
    campaigns,
    isLoadingSubscribers,
    isLoadingCampaigns,
    errorSubscribers,
    errorCampaigns,
    createCampaign,
    sendCampaign,
    deleteCampaign,
    fetchSubscribers,
    fetchCampaigns,
  } = useNewsletter()
  const { toast } = useToast()

  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false)
  const [newCampaignTitle, setNewCampaignTitle] = useState("")
  const [newCampaignContent, setNewCampaignContent] = useState("")
  const [isSendingCampaign, setIsSendingCampaign] = useState(false)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState("")

  useEffect(() => {
    fetchSubscribers()
    fetchCampaigns()
  }, [])

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingCampaign(true)
    try {
      const { error } = await createCampaign(newCampaignTitle, newCampaignContent)
      if (error) throw error
      toast({
        title: "Campanha criada!",
        description: "A nova campanha de newsletter foi salva.",
        variant: "default",
      })
      setNewCampaignTitle("")
      setNewCampaignContent("")
      setIsCreateCampaignModalOpen(false)
      fetchCampaigns() // Refresh campaigns list
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message || "Não foi possível criar a campanha.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Tem certeza que deseja enviar esta campanha para todos os assinantes?")) {
      return
    }
    setIsSendingCampaign(true)
    try {
      const { error } = await sendCampaign(campaignId)
      if (error) throw error
      toast({
        title: "Campanha enviada!",
        description: "A campanha foi enviada para todos os assinantes.",
        variant: "default",
      })
      fetchCampaigns() // Update status
    } catch (error: any) {
      toast({
        title: "Erro ao enviar campanha",
        description: error.message || "Não foi possível enviar a campanha.",
        variant: "destructive",
      })
    } finally {
      setIsSendingCampaign(false)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta campanha?")) {
      return
    }
    try {
      const { error } = await deleteCampaign(campaignId)
      if (error) throw error
      toast({
        title: "Campanha deletada!",
        description: "A campanha foi removida com sucesso.",
        variant: "default",
      })
      fetchCampaigns() // Refresh campaigns list
    } catch (error: any) {
      toast({
        title: "Erro ao deletar campanha",
        description: error.message || "Não foi possível deletar a campanha.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewCampaign = (content: string) => {
    setPreviewContent(content)
    setIsPreviewModalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Subscribers Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Assinantes da Newsletter
          </CardTitle>
          <CardDescription>Gerencie os usuários inscritos na sua newsletter.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSubscribers ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : errorSubscribers ? (
            <p className="text-red-500">Erro: {errorSubscribers.message}</p>
          ) : (
            <>
              <p className="text-2xl font-bold mb-4">{subscribers?.length || 0} Assinantes</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Inscrito em</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers?.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>{format(new Date(subscriber.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <Badge variant={subscriber.is_active ? "default" : "outline"}>
                            {subscriber.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {subscribers?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum assinante encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Campaign Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campanhas de Newsletter
          </CardTitle>
          <Button size="sm" onClick={() => setIsCreateCampaignModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingCampaigns ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : errorCampaigns ? (
            <p className="text-red-500">Erro: {errorCampaigns.message}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns?.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.title}</TableCell>
                      <TableCell>{format(new Date(campaign.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === 'sent' ? "default" : "secondary"}>
                          {campaign.status === 'draft' ? "Rascunho" : "Enviada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewCampaign(campaign.content)}
                          className="mr-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Visualizar</span>
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            disabled={isSendingCampaign}
                            className="mr-2"
                          >
                            {isSendingCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Enviar</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Deletar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaigns?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma campanha criada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateCampaignModalOpen} onOpenChange={setIsCreateCampaignModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
            <DialogDescription>
              Crie o conteúdo da sua newsletter para enviar aos assinantes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCampaign}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-title">Título da Campanha</Label>
                <Input
                  id="campaign-title"
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-content">Conteúdo (HTML ou Markdown)</Label>
                <Textarea
                  id="campaign-content"
                  value={newCampaignContent}
                  onChange={(e) => setNewCampaignContent(e.target.value)}
                  rows={10}
                  required
                  placeholder="Escreva o conteúdo da sua newsletter aqui. Suporta HTML básico ou Markdown."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateCampaignModalOpen(false)} disabled={isCreatingCampaign}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingCampaign}>
                {isCreatingCampaign ? "Criando..." : "Criar Campanha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pré-visualização da Campanha</DialogTitle>
            <DialogDescription>
              Veja como sua newsletter aparecerá para os assinantes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-white dark:bg-gray-950">
            {/* Render HTML content directly */}
            <div dangerouslySetInnerHTML={{ __html: previewContent }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
