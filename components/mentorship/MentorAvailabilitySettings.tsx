"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Trash2, Settings, Calendar } from "lucide-react"
import { 
  useMentorAvailability, 
  useAddAvailability, 
  useUpdateAvailability, 
  useRemoveAvailability 
} from "@/hooks/useMentorship"
import { type MentorAvailability } from "@/lib/services/mentorship/mentorship.service"
import { mentorshipUtils } from "@/lib/services/mentorship/mentorship.service"

interface MentorAvailabilitySettingsProps {
  isOpen: boolean
  onClose: () => void
}

interface AvailabilitySlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export function MentorAvailabilitySettings({ isOpen, onClose }: MentorAvailabilitySettingsProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "10:00",
    is_active: true
  })

  const { data: availability } = useMentorAvailability()
  const addAvailabilityMutation = useAddAvailability()
  const updateAvailabilityMutation = useUpdateAvailability()
  const removeAvailabilityMutation = useRemoveAvailability()

  // Carregar disponibilidade existente
  useEffect(() => {
    if (availability) {
      setSlots(availability.map(slot => ({
        id: slot.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: slot.is_active
      })))
    }
  }, [availability])

  const handleAddSlot = async () => {
    try {
      await addAvailabilityMutation.mutateAsync({
        day_of_week: newSlot.day_of_week,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        timezone: 'America/Sao_Paulo',
        is_active: newSlot.is_active
      })
      
      // Reset new slot
      setNewSlot({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:00",
        is_active: true
      })
    } catch (error) {
      console.error('Erro ao adicionar disponibilidade:', error)
    }
  }

  const handleUpdateSlot = async (slotId: string, updates: Partial<AvailabilitySlot>) => {
    try {
      await updateAvailabilityMutation.mutateAsync({
        availabilityId: slotId,
        updates: {
          day_of_week: updates.day_of_week,
          start_time: updates.start_time,
          end_time: updates.end_time,
          is_active: updates.is_active
        }
      })
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
    }
  }

  const handleRemoveSlot = async (slotId: string) => {
    try {
      await removeAvailabilityMutation.mutateAsync(slotId)
    } catch (error) {
      console.error('Erro ao remover disponibilidade:', error)
    }
  }

  const handleSlotChange = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updatedSlots = [...slots]
    updatedSlots[index] = { ...updatedSlots[index], [field]: value }
    setSlots(updatedSlots)
    
    // Auto-save if slot has ID
    const slot = updatedSlots[index]
    if (slot.id) {
      handleUpdateSlot(slot.id, { [field]: value })
    }
  }

  const getDayOptions = () => [
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' }
  ]

  const getTimeOptions = () => {
    const times = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(timeString)
      }
    }
    return times
  }

  const groupSlotsByDay = () => {
    const grouped: { [key: number]: AvailabilitySlot[] } = {}
    slots.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = []
      }
      grouped[slot.day_of_week].push(slot)
    })
    return grouped
  }

  const isValidSlot = (slot: AvailabilitySlot) => {
    return slot.start_time < slot.end_time
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Disponibilidade
          </DialogTitle>
          <DialogDescription>
            Defina os dias e horários em que você está disponível para mentorias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Slot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Horário
              </CardTitle>
              <CardDescription>
                Adicione um novo período de disponibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select 
                    value={newSlot.day_of_week.toString()} 
                    onValueChange={(value) => setNewSlot({...newSlot, day_of_week: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getDayOptions().map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Início</Label>
                  <Select 
                    value={newSlot.start_time} 
                    onValueChange={(value) => setNewSlot({...newSlot, start_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getTimeOptions().map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Select 
                    value={newSlot.end_time} 
                    onValueChange={(value) => setNewSlot({...newSlot, end_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getTimeOptions().map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleAddSlot}
                    disabled={!isValidSlot(newSlot) || addAvailabilityMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Disponibilidade Atual
              </CardTitle>
              <CardDescription>
                Gerencie seus horários de disponibilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots.length > 0 ? (
                <div className="space-y-4">
                  {getDayOptions().map(day => {
                    const daySlots = slots.filter(slot => slot.day_of_week === day.value)
                    if (daySlots.length === 0) return null

                    return (
                      <div key={day.value} className="space-y-2">
                        <h4 className="font-medium text-sm">{day.label}</h4>
                        <div className="space-y-2">
                          {daySlots.map((slot, index) => (
                            <div key={slot.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="flex items-center gap-2 flex-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <Select 
                                  value={slot.start_time} 
                                  onValueChange={(value) => {
                                    const slotIndex = slots.findIndex(s => s.id === slot.id)
                                    handleSlotChange(slotIndex, 'start_time', value)
                                  }}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getTimeOptions().map(time => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-muted-foreground">até</span>
                                <Select 
                                  value={slot.end_time} 
                                  onValueChange={(value) => {
                                    const slotIndex = slots.findIndex(s => s.id === slot.id)
                                    handleSlotChange(slotIndex, 'end_time', value)
                                  }}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getTimeOptions().map(time => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={slot.is_active}
                                  onCheckedChange={(checked) => {
                                    const slotIndex = slots.findIndex(s => s.id === slot.id)
                                    handleSlotChange(slotIndex, 'is_active', checked)
                                  }}
                                />
                                <Badge variant={slot.is_active ? "default" : "secondary"}>
                                  {slot.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                                {slot.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveSlot(slot.id!)}
                                    disabled={removeAvailabilityMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma disponibilidade configurada</p>
                  <p className="text-sm">Adicione seus horários disponíveis acima</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">💡 Dicas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Você pode ter múltiplos horários no mesmo dia</p>
              <p>• Use o switch para ativar/desativar horários temporariamente</p>
              <p>• Sessões de mentoria têm duração padrão de 1 hora</p>
              <p>• Você receberá notificações de novas solicitações por email</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
