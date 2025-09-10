"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  Clock,
  Activity,
  CheckCircle,
  Plus,
  Lock,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import {
  useCreateVolunteerActivity,
  useVolunteerActivities
} from "@/hooks/api/use-volunteer-activities"
import { useIsVolunteer } from "@/hooks/useVolunteerAccess"

const volunteerActivitySchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  activity_type: z.string().min(1, "Tipo de atividade é obrigatório"),
  description: z.string().optional(),
  hours: z
    .number()
    .min(0.5, "Mínimo de 0.5 horas")
    .max(24, "Máximo de 24 horas"),
  date: z.date({
    required_error: "Data é obrigatória"
  })
})

type VolunteerActivityForm = z.infer<typeof volunteerActivitySchema>

const ACTIVITY_TYPES = [
  { value: "mentoria", label: "Mentoria" },
  { value: "workshop", label: "Workshop/Evento" },
  { value: "palestra", label: "Palestra" },
  { value: "codigo", label: "Desenvolvimento de Software" },
  { value: "design", label: "Design/UX" },
  { value: "marketing", label: "Marketing/Comunicação" },
  { value: "administracao", label: "Administração/Gestão" },
  { value: "suporte", label: "Suporte Técnico" },
  { value: "traducao", label: "Tradução" },
  { value: "outro", label: "Outro" }
]

export default function CheckinPage() {
  const { user, isVolunteer } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const createActivity = useCreateVolunteerActivity()
  const {
    //  data: isVolunteer,

    isLoading: isVolunteerLoading
  } = useIsVolunteer()

  // Fetch user's own activities
  const { data: activities, isLoading } = useVolunteerActivities({
    user_only: true
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<VolunteerActivityForm>({
    resolver: zodResolver(volunteerActivitySchema),
    defaultValues: {
      hours: 1,
      date: new Date()
    }
  })

  const selectedDate = watch("date")

  // Loading state
  if (isVolunteerLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Check if user can access volunteer area
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Login Necessário</h3>
              <p className="text-muted-foreground">
                Faça login para registrar suas atividades de voluntariado.
              </p>
              <Button asChild className="mt-4">
                <Link href="/auth/login">Fazer Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is a volunteer
  if (!isVolunteer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground mb-4">
                Esta página é exclusiva para voluntários da plataforma.
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline">
                  <Link href="/voluntariometro">Ver Estatísticas Públicas</Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">Voltar ao Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: VolunteerActivityForm) => {
    try {
      await createActivity.mutateAsync({
        ...data,
        date: format(data.date, "yyyy-MM-dd")
      })
      reset()
      setShowForm(false)
    } catch (error) {
      console.error("Erro ao registrar atividade:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validated":
        return (
          <Badge variant="default" className="bg-green-500">
            Validada
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>
      default:
        return <Badge variant="secondary">Pendente</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Minhas Atividades de Voluntariado
            </h1>
            <p className="text-muted-foreground">
              Registre e acompanhe suas contribuições
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Registrar Nova Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Atividade *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Mentoria em React"
                      {...register("title")}
                      className={cn(errors.title && "border-red-500")}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity_type">Tipo de Atividade *</Label>
                    <select
                      id="activity_type"
                      {...register("activity_type")}
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        errors.activity_type && "border-red-500"
                      )}
                    >
                      <option value="">Selecione um tipo</option>
                      {ACTIVITY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.activity_type && (
                      <p className="text-sm text-red-500">
                        {errors.activity_type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data da Atividade *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, "PPP", { locale: ptBR })
                            : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) =>
                            setValue("date", date || new Date())
                          }
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">Horas Trabalhadas *</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      placeholder="1.5"
                      {...register("hours", { valueAsNumber: true })}
                      className={cn(errors.hours && "border-red-500")}
                    />
                    {errors.hours && (
                      <p className="text-sm text-red-500">
                        {errors.hours.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que foi realizado, resultados obtidos, pessoas impactadas, etc."
                    {...register("description")}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createActivity.isPending}>
                    {createActivity.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Registrar Atividade
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Atividades</CardTitle>
            <CardDescription>
              Suas atividades registradas e seus status de validação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activities && activities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {activity.title}
                      </TableCell>
                      <TableCell>{activity.activity_type}</TableCell>
                      <TableCell>
                        {format(new Date(activity.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{activity.hours}h</TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhuma atividade registrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece registrando sua primeira atividade de voluntariado!
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primeira Atividade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
