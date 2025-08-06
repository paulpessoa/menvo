"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface TimeSlot {
  id: string
  day: string
  start: string
  end: string
}

export function MentorAvailability() {
  const [availability, setAvailability] = useState<TimeSlot[]>([])
  const [newSlot, setNewSlot] = useState<Omit<TimeSlot, 'id'>>({
    day: "monday",
    start: "09:00",
    end: "17:00",
  })

  const daysOfWeek = [
    { value: "sunday", label: "Domingo" },
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "saturday", label: "Sábado" },
  ]

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return [`${hour}:00`, `${hour}:30`]
  }).flat()

  const addSlot = () => {
    if (!newSlot.day || !newSlot.start || !newSlot.end) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para adicionar um horário.",
        variant: "destructive",
      })
      return
    }
    if (newSlot.start >= newSlot.end) {
      toast({
        title: "Horário inválido",
        description: "O horário de início deve ser anterior ao horário de término.",
        variant: "destructive",
      })
      return
    }

    setAvailability((prev) => [...prev, { ...newSlot, id: Date.now().toString() }])
    setNewSlot({ day: "monday", start: "09:00", end: "17:00" })
    toast({
      title: "Horário adicionado",
      description: "Novo horário de disponibilidade adicionado.",
      variant: "default",
    })
  }

  const removeSlot = (id: string) => {
    setAvailability((prev) => prev.filter((slot) => slot.id !== id))
    toast({
      title: "Horário removido",
      description: "Horário de disponibilidade removido.",
      variant: "default",
    })
  }

  const handleSave = () => {
    // Here you would send the 'availability' array to your backend API
    console.log("Saving availability:", availability)
    toast({
      title: "Disponibilidade salva!",
      description: "Sua disponibilidade foi atualizada com sucesso.",
      variant: "default",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha Disponibilidade</CardTitle>
        <CardDescription>Defina os horários em que você está disponível para sessões de mentoria.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availability.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum horário de disponibilidade adicionado ainda.</p>
        ) : (
          <div className="space-y-4">
            {availability.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {daysOfWeek.find(d => d.value === slot.day)?.label}
                  </span>
                  <span>{slot.start} - {slot.end}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="sr-only">Remover horário</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <h3 className="text-lg font-semibold">Adicionar Novo Horário</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="day">Dia da Semana</Label>
            <Select value={newSlot.day} onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}>
              <SelectTrigger id="day">
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">Início</Label>
            <Select value={newSlot.start} onValueChange={(value) => setNewSlot({ ...newSlot, start: value })}>
              <SelectTrigger id="start-time">
                <SelectValue placeholder="Início" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Término</Label>
            <Select value={newSlot.end} onValueChange={(value) => setNewSlot({ ...newSlot, end: value })}>
              <SelectTrigger id="end-time">
                <SelectValue placeholder="Término" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addSlot} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>

        <Button onClick={handleSave} className="w-full mt-6">
          Salvar Disponibilidade
        </Button>
      </CardContent>
    </Card>
  )
}
