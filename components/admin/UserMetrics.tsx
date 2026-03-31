"use client"

import { useMemo } from "react"
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

interface UserMetricsProps {
  data: any[]
  appointments?: any[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function UserMetrics({ data, appointments = [] }: UserMetricsProps) {
  const roleDistribution = useMemo(() => {
    const roles: Record<string, number> = {}
    data.forEach(user => {
      user.roles?.forEach((role: string) => {
        roles[role] = (roles[role] || 0) + 1
      })
    })
    return Object.entries(roles).map(([name, value]) => ({ name, value }))
  }, [data])

  const signupTrend = useMemo(() => {
    const dates: Record<string, number> = {}
    data.forEach(user => {
      const date = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      dates[date] = (dates[date] || 0) + 1
    })
    return Object.entries(dates)
      .map(([name, value]) => ({ name, value }))
      .slice(-10)
  }, [data])

  const mentorshipTrend = useMemo(() => {
    const dates: Record<string, number> = {}
    appointments.forEach(app => {
      const date = new Date(app.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      dates[date] = (dates[date] || 0) + 1
    })
    return Object.entries(dates)
      .map(([name, value]) => ({ name, value }))
      .slice(-10)
  }, [appointments])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Roles</CardTitle>
            <CardDescription>Quantidade de usuários por papel no sistema</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
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

        <Card>
          <CardHeader>
            <CardTitle>Tendência de Engajamento</CardTitle>
            <CardDescription>Novas mentorias agendadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mentorshipTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Novos Usuários</CardTitle>
          <CardDescription>Novos cadastros nos últimos 10 dias registrados</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signupTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
