"use client"

import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface UserMetricsProps {
  data: any[]
  appointments?: any[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function UserMetrics({ data, appointments = [] }: UserMetricsProps) {
  const [daysRange, setDaysRange] = useState("30")

  const filteredData = useMemo(() => {
    if (daysRange === "all") return data
    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(now.getDate() - parseInt(daysRange))
    return data.filter(user => new Date(user.created_at) >= cutoff)
  }, [data, daysRange])

  const roleDistribution = useMemo(() => {
    const roles: Record<string, number> = {}
    data.forEach(user => {
      user.roles?.forEach((role: string) => {
        const label = role === 'mentor' ? 'Mentores' : role === 'mentee' ? 'Mentees' : role
        roles[label] = (roles[label] || 0) + 1
      })
    })
    return Object.entries(roles).map(([name, value]) => ({ name, value }))
  }, [data])

  const signupTrend = useMemo(() => {
    const counts: Record<string, number> = {}
    const now = new Date()
    const range = daysRange === "all" ? 365 : parseInt(daysRange)
    
    // Inicializar todos os dias com zero para continuidade
    for (let i = range; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const label = d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      counts[label] = 0
    }

    filteredData.forEach(user => {
      const date = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      if (counts[date] !== undefined) {
        counts[date] += 1
      }
    })

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredData, daysRange])

  const mentorshipTrend = useMemo(() => {
    const counts: Record<string, number> = {}
    const now = new Date()
    const range = daysRange === "all" ? 30 : parseInt(daysRange)

    for (let i = range; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const label = d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
        counts[label] = 0
    }

    appointments.forEach(app => {
      const date = new Date(app.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      if (counts[date] !== undefined) {
        counts[date] += 1
      }
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [appointments, daysRange])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
          <Select value={daysRange} onValueChange={setDaysRange}>
            <SelectTrigger className="w-[180px] bg-white">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o histórico</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Perfis</CardTitle>
            <CardDescription>Composição da base de usuários</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Engajamento de Mentorias</CardTitle>
            <CardDescription>Volume de agendamentos no período</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mentorshipTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none bg-white/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-blue-900">Fluxo de Novos Usuários</CardTitle>
          <CardDescription>
              {daysRange === "all" ? "Todos os cadastros registrados" : `Novos usuários nos últimos ${daysRange} dias`}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signupTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
