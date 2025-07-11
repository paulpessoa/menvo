"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Search,
  ArrowUpDown,
  Clock,
  Activity,
  TrendingUp,
  Users,
  Download,
  CheckCircle,
  XCircle,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/hooks/useAuth"
import { useVolunteerActivities, useVolunteerStats, useValidateActivity } from "@/hooks/api/use-volunteer-activities"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function VoluntariometroPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "hours" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [validationNotes, setValidationNotes] = useState("")
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("public")

  const isAdminOrModerator = user?.role === "admin" || user?.role === "moderator"
  const isVolunteer = user?.volunteer_role === true || user?.role === "volunteer"

  // Determine which data to fetch based on tab and user role
  const shouldFetchAll = activeTab === "admin" && isAdminOrModerator
  const shouldFetchOwn = activeTab === "personal" && isVolunteer

  const {
    data: activities,
    isLoading,
    refetch,
  } = useVolunteerActivities({
    search: searchTerm,
    // status: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    sortOrder,
    // userOnly: shouldFetchOwn,
  })

  const { data: stats } = useVolunteerStats()
  const validateActivity = useValidateActivity()

  // Chart data for public view (only validated activities)
  const publicChartData = useMemo(() => {
    if (!activities) return { monthly: [], byType: [], statusData: [] }

    const validatedActivities = activities.filter((activity: any) => activity.status === "validated")

    // Monthly data
    const monthlyData = validatedActivities.reduce((acc: any, activity: any) => {
      const month = format(new Date(activity.date), "MMM yyyy", { locale: ptBR })
      const existing = acc.find((item: any) => item.month === month)
      if (existing) {
        existing.hours += Number.parseFloat(activity.hours)
        existing.activities += 1
      } else {
        acc.push({ month, hours: Number.parseFloat(activity.hours), activities: 1 })
      }
      return acc
    }, [])

    // By type data
    const byTypeData = validatedActivities.reduce((acc: any, activity: any) => {
      const existing = acc.find((item: any) => item.type === activity.activity_type)
      if (existing) {
        existing.hours += Number.parseFloat(activity.hours)
        existing.count += 1
      } else {
        acc.push({ type: activity.activity_type, hours: Number.parseFloat(activity.hours), count: 1 })
      }
      return acc
    }, [])

    return { monthly: monthlyData, byType: byTypeData, statusData: [] }
  }, [activities])

  // Chart data for admin view (all activities)
  const adminChartData = useMemo(() => {
    if (!activities) return { monthly: [], byType: [], statusData: [] }

    // Monthly data
    const monthlyData = activities.reduce((acc: any, activity: any) => {
      const month = format(new Date(activity.date), "MMM yyyy", { locale: ptBR })
      const existing = acc.find((item: any) => item.month === month)
      if (existing) {
        existing.hours += Number.parseFloat(activity.hours)
        existing.activities += 1
      } else {
        acc.push({ month, hours: Number.parseFloat(activity.hours), activities: 1 })
      }
      return acc
    }, [])

    // By type data
    const byTypeData = activities.reduce((acc: any, activity: any) => {
      const existing = acc.find((item: any) => item.type === activity.activity_type)
      if (existing) {
        existing.hours += Number.parseFloat(activity.hours)
        existing.count += 1
      } else {
        acc.push({ type: activity.activity_type, hours: Number.parseFloat(activity.hours), count: 1 })
      }
      return acc
    }, [])

    // Status data
    const statusData = activities.reduce((acc: any, activity: any) => {
      const existing = acc.find((item: any) => item.status === activity.status)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ status: activity.status, count: 1 })
      }
      return acc
    }, [])

    return { monthly: monthlyData, byType: byTypeData, statusData }
  }, [activities])

  const handleValidation = async (activityId: string, status: "validated" | "rejected") => {
    try {
      await validateActivity.mutateAsync({
        activityId,
        status,
        notes: validationNotes,
      })
      setValidationNotes("")
      setSelectedActivity(null)
      refetch()
    } catch (error) {
      console.error("Erro ao validar atividade:", error)
    }
  }

  const exportToCSV = () => {
    if (!activities) return

    const csvContent = [
      ["Nome", "Email", "Data", "Horas", "Atividade", "Descrição", "Status", "Validado por", "Data de Validação"].join(
        ",",
      ),
      ...activities.map((activity: any) =>
        [
          activity.profiles?.first_name + " " + activity.profiles?.last_name,
          activity.profiles?.email,
          format(new Date(activity.date), "dd/MM/yyyy"),
          activity.hours,
          activity.activity_type,
          activity.description || "",
          activity.status,
          activity.validator?.first_name + " " + activity.validator?.last_name || "",
          activity.validated_at ? format(new Date(activity.validated_at), "dd/MM/yyyy HH:mm") : "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `voluntariado_${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const [testResponse, setTestResponse] = useState<any>(null)

  const handleTestBackendQuery = async () => {
    try {
      const res = await fetch("/api/volunteer-activities")
      const data = await res.json()
      setTestResponse(data)
    } catch (error) {
      setTestResponse({ error: "Failed to fetch from backend" })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Debug Voluntariômetro</h1>
      <Button onClick={handleTestBackendQuery} className="mb-4">
        Test Backend Query
      </Button>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto mb-4">
        {JSON.stringify(activities, null, 2)}
      </pre>
      <h2 className="text-lg font-semibold mb-2">Test Query Response</h2>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
        {testResponse ? JSON.stringify(testResponse, null, 2) : "No test query run yet."}
      </pre>
    </div>
  )
}
