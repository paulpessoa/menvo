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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, FilterX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserMetricsProps {
  data: any[]
  appointments?: any[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function UserMetrics({ data, appointments = [] }: UserMetricsProps) {
  const [daysRange, setDaysRange] = useState("30")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filteredData = useMemo(() => {
    let result = data

    // Prioridade para filtro manual de data
    if (startDate || endDate) {
        if (startDate) {
            const start = new Date(startDate)
            result = result.filter(user => new Date(user.created_at) >= start)
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            result = result.filter(user => new Date(user.created_at) <= end)
        }
        return result
    }

    // Fallback para presets
    if (daysRange === "all") return data
    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(now.getDate() - parseInt(daysRange))
    return data.filter(user => new Date(user.created_at) >= cutoff)
  }, [data, daysRange, startDate, endDate])

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
    
    // Calcular range de dias
    let start: Date
    let end = new Date()

    if (startDate) {
        start = new Date(startDate)
    } else {
        const range = daysRange === "all" ? 365 : parseInt(daysRange)
        start = new Date()
        start.setDate(end.getDate() - range)
    }

    if (endDate) {
        end = new Date(endDate)
    }

    // Inicializar os dias no range com zero
    const temp = new Date(start)
    while (temp <= end) {
        const label = temp.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
        counts[label] = 0
        temp.setDate(temp.getDate() + 1)
    }

    filteredData.forEach(user => {
      const date = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      if (counts[date] !== undefined) {
        counts[date] += 1
      }
    })

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredData, daysRange, startDate, endDate])

  const clearFilters = () => {
      setStartDate("")
      setEndDate("")
      setDaysRange("30")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-muted/20 p-4 rounded-xl border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 w-full">
              <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Início</Label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="h-9 bg-white"
                  />
              </div>
              <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fim</Label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="h-9 bg-white"
                  />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Presets</Label>
                <Select value={daysRange} onValueChange={setDaysRange} disabled={!!(startDate || endDate)}>
                    <SelectTrigger className="h-9 bg-white">
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
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
              <FilterX className="h-3 w-3 mr-2" /> Limpar
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Perfis</CardTitle>
            <CardDescription>Base total de usuários</CardDescription>
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
            <CardTitle className="text-lg text-blue-900 font-bold">Fluxo de Novos Usuários</CardTitle>
            <CardDescription>
                Novos cadastros por dia no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
    </div>
  )
}
