"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Download, 
  Search,
  Calendar,
  Shield,
  Phone
} from "lucide-react"
import { useNewsletterStats, useNewsletterSubscriptions } from "@/hooks/useNewsletter"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function NewsletterDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  
  const { data: stats, isLoading: statsLoading } = useNewsletterStats()
  const { data: subscriptions, isLoading: subscriptionsLoading } = useNewsletterSubscriptions()

  const filteredSubscriptions = subscriptions?.filter(sub => 
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const exportToCSV = () => {
    if (!subscriptions) return

    const headers = ['Email', 'Nome', 'WhatsApp', 'Data de Inscrição', 'Consentimento Marketing', 'Status']
    const csvContent = [
      headers.join(','),
      ...subscriptions.map(sub => [
        sub.email,
        sub.name || '',
        sub.whatsapp || '',
        format(new Date(sub.subscribed_at || ''), 'dd/MM/yyyy HH:mm'),
        sub.marketing_consent ? 'Sim' : 'Não',
        sub.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Newsletter Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie inscrições e visualize estatísticas da newsletter
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!subscriptions}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscritos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Recebem nossa newsletter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Incluindo canceladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${stats?.conversion_rate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Inscritos ativos vs total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.unsubscribed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários que cancelaram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Inscritos</CardTitle>
              <CardDescription>
                Todos os usuários inscritos na newsletter
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <div className="text-center py-8">Carregando inscrições...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                  <TableHead>Consentimentos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {subscription.email}
                    </TableCell>
                    <TableCell>
                      {subscription.name || '-'}
                    </TableCell>
                    <TableCell>
                      {subscription.whatsapp ? (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{subscription.whatsapp}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {format(
                            new Date(subscription.subscribed_at || ''), 
                            'dd/MM/yyyy HH:mm',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-green-500" />
                          <span className="text-xs">Newsletter</span>
                        </div>
                        {subscription.marketing_consent && (
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3 text-blue-500" />
                            <span className="text-xs">Marketing</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={subscription.status === 'active' ? 'default' : 'secondary'}
                      >
                        {subscription.status === 'active' ? 'Ativo' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!subscriptionsLoading && filteredSubscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum inscrito encontrado para a busca.' : 'Nenhum inscrito ainda.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 