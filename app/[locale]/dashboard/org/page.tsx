"use client"

import { useCallback, useEffect, useState } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"

interface OrgOption {
  id: string
  slug: string
  name: string
}

interface Beneficiary {
  userId: string
  role: string
  joinedAt: string
  fullName: string | null
  email: string | null
  sessionsBooked: number
  quizDone: boolean
}

export default function OrgAdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [organization, setOrganization] = useState<{ name: string; slug: string } | null>(null)
  const [members, setMembers] = useState<Beneficiary[]>([])

  const loadOrg = useCallback(async (orgId: string) => {
    try {
      const response = await fetch(`/api/org/${orgId}`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao carregar organização")
      setOrganization(json.data.organization)
      setMembers(json.data.members)
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/org/mine")
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || "Falha ao carregar organizações")
        const options: OrgOption[] = json.data || []
        setOrgOptions(options)
        if (options.length > 0) {
          setSelectedOrgId(options[0].id)
          await loadOrg(options[0].id)
        }
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadOrg])

  if (loading) {
    return (
      <PageContainer className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </PageContainer>
    )
  }

  if (!selectedOrgId || orgOptions.length === 0) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-center py-20">
          Você não administra nenhuma organização parceira.
        </p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{organization?.name ?? "Minha Organização"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beneficiários ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Ainda ninguém se cadastrou por{" "}
              <code>/o/{organization?.slug}/signup</code>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Quiz feito</TableHead>
                  <TableHead>Sessões agendadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.userId}>
                    <TableCell className="font-medium">{m.fullName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                        {m.role === "admin" ? "Admin" : "Beneficiário"}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.quizDone ? "Sim" : "Não"}</TableCell>
                    <TableCell>{m.sessionsBooked}</TableCell>
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
