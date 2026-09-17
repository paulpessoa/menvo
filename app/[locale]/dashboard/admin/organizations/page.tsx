"use client"

import { useCallback, useEffect, useState } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Loader2, Plus, Building2 } from "lucide-react"
import { toast } from "sonner"

interface Organization {
  id: string
  slug: string
  name: string
  type: string
  status: "active" | "suspended"
  contact_name: string | null
  contact_email: string | null
  created_at: string
  member_count: number
}

const ORG_TYPES = [
  { value: "ngo", label: "ONG" },
  { value: "company", label: "Empresa" },
  { value: "event", label: "Evento" },
  { value: "school", label: "Escola/Universidade" },
  { value: "other", label: "Outro" }
]

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [adminEmailById, setAdminEmailById] = useState<Record<string, string>>({})

  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    type: "ngo",
    contact_name: "",
    contact_email: ""
  })

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/organizations")
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao carregar organizações")
      setOrganizations(json.data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const handleSlugFromName = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setNewOrg(prev => ({ ...prev, name, slug: prev.slug ? prev.slug : slug }))
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrg)
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao criar organização")
      toast.success("Organização criada")
      setNewOrg({ name: "", slug: "", type: "ngo", contact_name: "", contact_email: "" })
      fetchOrganizations()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (org: Organization) => {
    const nextStatus = org.status === "active" ? "suspended" : "active"
    try {
      const response = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao atualizar organização")
      toast.success(nextStatus === "active" ? "Organização reativada" : "Organização suspensa")
      fetchOrganizations()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleAssignAdmin = async (orgId: string) => {
    const email = adminEmailById[orgId]?.trim()
    if (!email) return
    setAssigningId(orgId)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao atribuir admin")
      toast.success("Admin da organização atribuído")
      setAdminEmailById(prev => ({ ...prev, [orgId]: "" }))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Organizações Parceiras</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nova organização</CardTitle>
          <CardDescription>
            Cria o registro e a URL pública em <code>/o/[slug]</code>. Beneficiários se
            cadastram por lá com uma conta de mentee normal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={newOrg.name}
              onChange={e => handleSlugFromName(e.target.value)}
              placeholder="Instituto Gira"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (/o/...)</Label>
            <Input
              value={newOrg.slug}
              onChange={e => setNewOrg(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="instituto-gira"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={newOrg.type}
              onValueChange={value => setNewOrg(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do contato</Label>
            <Input
              value={newOrg.contact_name}
              onChange={e => setNewOrg(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Leonildo"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>E-mail do contato</Label>
            <Input
              type="email"
              value={newOrg.contact_email}
              onChange={e => setNewOrg(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="contato@institutogira.org"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreate}
            disabled={creating || !newOrg.name || !newOrg.slug}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Criar organização
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todas as organizações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : organizations.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Nenhuma organização cadastrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atribuir admin</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">/o/{org.slug}</TableCell>
                    <TableCell>
                      {ORG_TYPES.find(t => t.value === org.type)?.label || org.type}
                    </TableCell>
                    <TableCell>{org.member_count}</TableCell>
                    <TableCell>
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>
                        {org.status === "active" ? "Ativa" : "Suspensa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="email@org.com"
                          className="h-8 w-40"
                          value={adminEmailById[org.id] ?? ""}
                          onChange={e =>
                            setAdminEmailById(prev => ({ ...prev, [org.id]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={assigningId === org.id || !adminEmailById[org.id]}
                          onClick={() => handleAssignAdmin(org.id)}
                        >
                          {assigningId === org.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Atribuir"
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={org.status === "active" ? "destructive" : "outline"}
                        onClick={() => handleToggleStatus(org)}
                      >
                        {org.status === "active" ? "Suspender" : "Reativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
