import { EventCalendar } from '@/components/events/event-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CalendarPage() {
  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Meu Calendário</h1>
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos e Sessões</CardTitle>
            <CardDescription>Visualize e gerencie seus compromissos de mentoria e eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            <EventCalendar />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
