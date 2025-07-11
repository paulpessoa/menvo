"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Clock, Activity, FileText, CheckCircle, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useCreateVolunteerActivity, useVolunteerActivityTypes } from "@/hooks/api/use-volunteer-activities"
import { Alert, AlertDescription } from "@/components/ui/alert"

const volunteerActivitySchema = z.object({
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  hours: z.number().min(0.5, "Mínimo de 0.5 horas").max(24, "Máximo de 24 horas"),
  activity_type: z.string().min(1, "Selecione um tipo de atividade"),
  description: z.string().optional(),
  location: z.string().optional(),
})

type VolunteerActivityForm = z.infer<typeof volunteerActivitySchema>

export default function CheckinPage() {
  const { user } = useAuth()
  const [date, setDate] = useState<Date>(new Date())
  const createActivity = useCreateVolunteerActivity()
  const { data: activityTypes } = useVolunteerActivityTypes()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VolunteerActivityForm>({
    resolver: zodResolver(volunteerActivitySchema),
    defaultValues: {
      date: new Date(),
      hours: 1,
    },
  })

  // Check if user can access volunteer area
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Login Necessário</h3>
              <p className="text-muted-foreground">Faça login para registrar suas atividades de voluntariado.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: VolunteerActivityForm) => {
    if (!date) return

    const activityData = {
      ...data,
      date: format(date, "yyyy-MM-dd"),
    }

    try {
      await createActivity.mutateAsync(activityData)
      reset()
      setDate(new Date())
    } catch (error) {
      console.error("Erro ao registrar atividade:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Check-in de Voluntariado
            </CardTitle>
            <CardDescription>
              Registre suas atividades de voluntariado para contribuir com nossa comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Info */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date and Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Data da Atividade *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          setDate(selectedDate || new Date())
                          setValue("date", selectedDate || new Date())
                        }}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {!date && <p className="text-sm text-red-500">Data é obrigatória</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horas Trabalhadas *
                  </Label>
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
                  {errors.hours && <p className="text-sm text-red-500">{errors.hours.message}</p>}
                </div>
              </div>

              {/* Activity Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tipo de Atividade *
                </Label>
                <Select onValueChange={(value) => setValue("activity_type", value)}>
                  <SelectTrigger className={cn(errors.activity_type && "border-red-500")}>
                    <SelectValue placeholder="Selecione o tipo de atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                        {type.description && <span className="text-muted-foreground ml-2">- {type.description}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.activity_type && <p className="text-sm text-red-500">{errors.activity_type.message}</p>}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local (Opcional)
                </Label>
                <Input id="location" placeholder="Ex: Online, São Paulo - SP, Evento XYZ" {...register("location")} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição da Atividade (Opcional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva brevemente o que foi realizado, resultados obtidos, pessoas impactadas, etc."
                  {...register("description")}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Detalhe sua contribuição para ajudar na validação da atividade
                </p>
              </div>

              {/* Validation Notice */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Sua atividade será registrada como "pendente" e passará por validação da equipe de moderadores
                  voluntários antes de ser contabilizada oficialmente.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={createActivity.isPending}>
                {createActivity.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Registrar Atividade de Voluntariado
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">💡 Dicas para um bom registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Seja específico sobre o tipo de atividade realizada</p>
            <p>• Inclua detalhes sobre o impacto ou resultado da sua contribuição</p>
            <p>• Registre as horas de forma honesta e precisa</p>
            <p>• Se possível, mencione quantas pessoas foram impactadas</p>
            <p>• Atividades regulares podem ser registradas separadamente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
