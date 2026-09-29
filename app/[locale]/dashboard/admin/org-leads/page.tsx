"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Inbox, CheckCircle2, XCircle } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { Badge } from "@/components/ui/badge"
import { PageContainer } from "@/components/layout/PageContainer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface OrgLead {
  id: string
  org_name: string
  org_type: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  people_estimate: string
  message: string | null
  locale: string | null
  status: string
  created_at: string
}

export default function AdminOrgLeadsPage() {
  const [leads, setLeads] = useState<OrgLead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('new')
  const { toast } = useToast()

  useEffect(() => {
    fetchLeads(filter)
  }, [filter])

  async function fetchLeads(status: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/org-leads?status=${status}`)
      if (!res.ok) throw new Error("Failed to fetch leads")
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error(error)
      toast({ title: "Erro ao buscar leads", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch('/api/admin/org-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      
      if (!res.ok) throw new Error("Failed to update status")
      
      toast({ title: "Status atualizado com sucesso" })
      // Remove from current list if we are filtering by a specific status
      setLeads(prev => prev.filter(l => l.id !== id))
    } catch (error) {
      console.error(error)
      toast({ title: "Erro ao atualizar status", variant: "destructive" })
    }
  }

  const typeMap: Record<string, string> = {
    ngo: 'ONG / Terceiro Setor',
    company: 'Empresa',
    school: 'Instituição de Ensino',
    event: 'Evento',
    other: 'Outro'
  }

  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Organizações Interessadas</h1>
            <p className="text-muted-foreground text-lg">Gerencie os pedidos de quem quer a Menvo na sua organização.</p>
          </div>

          <Tabs value={filter} onValueChange={setFilter} className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger 
                value="new" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <Inbox className="w-4 h-4" /> Novos
              </TabsTrigger>
              <TabsTrigger 
                value="contacted" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Contatados
              </TabsTrigger>
              <TabsTrigger 
                value="closed" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Encerrados
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <MenvoDots />
                </div>
              ) : leads.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Building2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhum lead encontrado com este status.</p>
                  </CardContent>
                </Card>
              ) : (
                leads.map(lead => (
                  <Card key={lead.id}>
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            {lead.org_name}
                            <Badge variant="outline">{typeMap[lead.org_type] || lead.org_type}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Recebido em {new Date(lead.created_at).toLocaleString("pt-BR")}
                          </CardDescription>
                        </div>
                        <div className="w-48">
                          <Select 
                            value={lead.status} 
                            onValueChange={(val) => updateStatus(lead.id, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Novo</SelectItem>
                              <SelectItem value="contacted">Contatado</SelectItem>
                              <SelectItem value="closed">Encerrado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-1">Contato</p>
                        <p className="text-sm">{lead.contact_name}</p>
                        <a href={`mailto:${lead.contact_email}`} className="text-sm text-primary hover:underline">{lead.contact_email}</a>
                        {lead.contact_phone && <p className="text-sm text-muted-foreground">{lead.contact_phone}</p>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Tamanho da organização</p>
                        <p className="text-sm">{lead.people_estimate} pessoas</p>
                      </div>
                      {lead.message && (
                        <div className="md:col-span-2 mt-2 p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Mensagem</p>
                          <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Tabs>
        </div>
      </PageContainer>
    </RequireRole>
  )
}
