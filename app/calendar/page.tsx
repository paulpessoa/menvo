"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">
            Gerencie suas sessões de mentoria e compromissos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sistema de Agendamento
          </CardTitle>
          <CardDescription>
            Calendário integrado para mentores e mentees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Calendário em Desenvolvimento</h3>
            <p className="mb-4">
              Estamos trabalhando em um sistema completo de agendamento que incluirá:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="space-y-2">
                <h4 className="font-medium">Para Mentores:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Definir disponibilidade</li>
                  <li>• Gerenciar sessões</li>
                  <li>• Histórico de mentorias</li>
                  <li>• Notificações automáticas</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Para Mentees:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Agendar sessões</li>
                  <li>• Ver próximos compromissos</li>
                  <li>• Cancelar/reagendar</li>
                  <li>• Avaliar sessões</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
