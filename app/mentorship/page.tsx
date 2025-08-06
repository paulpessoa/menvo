import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MentorAvailabilitySettings } from '@/components/mentorship/MentorAvailabilitySettings'
import { SessionDetailsModal } from '@/components/mentorship/SessionDetailsModal'
import { SessionResponseModal } from '@/components/mentorship/SessionResponseModal'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MentorshipPage() {
  // Mock data for sessions
  const upcomingSessions = [
    {
      id: '1',
      mentorName: 'Dr. Ana Paula',
      menteeName: 'Carlos Eduardo',
      date: '2025-08-15',
      time: '10:00',
      topic: 'Planejamento de Carreira em TI',
      status: 'confirmed',
      isMentor: true, // This user is the mentor for this session
    },
    {
      id: '2',
      mentorName: 'João Silva',
      menteeName: 'Você',
      date: '2025-08-20',
      time: '14:30',
      topic: 'Introdução ao Marketing Digital',
      status: 'confirmed',
      isMentor: false, // This user is the mentee for this session
    },
  ]

  const pendingRequests = [
    {
      id: '3',
      mentorName: 'Você',
      menteeName: 'Mariana Costa',
      date: '2025-08-18',
      time: '11:00',
      topic: 'Revisão de Portfólio de Design',
      status: 'pending',
      isMentor: true, // This user is the mentor for this session
    },
  ]

  const pastSessions = [
    {
      id: '4',
      mentorName: 'Dr. Ana Paula',
      menteeName: 'Carlos Eduardo',
      date: '2025-07-25',
      time: '10:00',
      topic: 'Primeiros Passos em Liderança',
      status: 'completed',
      isMentor: true,
    },
  ]

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Minhas Mentorias</h1>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Próximas Sessões</TabsTrigger>
            <TabsTrigger value="pending">Solicitações Pendentes</TabsTrigger>
            <TabsTrigger value="past">Sessões Anteriores</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Suas Próximas Sessões</CardTitle>
                <CardDescription>Aqui estão as sessões de mentoria confirmadas.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma sessão futura agendada.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <Card key={session.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            {session.isMentor ? `Mentee: ${session.menteeName}` : `Mentor: ${session.mentorName}`}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(session.date).toLocaleDateString()} às {session.time} - {session.topic}
                          </p>
                        </div>
                        <SessionDetailsModal session={session} />
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Mentoria Pendentes</CardTitle>
                <CardDescription>Revise e responda às solicitações de mentoria.</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma solicitação pendente no momento.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((session) => (
                      <Card key={session.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            Solicitação de: {session.menteeName}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(session.date).toLocaleDateString()} às {session.time} - {session.topic}
                          </p>
                        </div>
                        <SessionResponseModal session={session} />
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sessões Anteriores</CardTitle>
                <CardDescription>Um histórico de suas sessões de mentoria concluídas.</CardDescription>
              </CardHeader>
              <CardContent>
                {pastSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma sessão anterior registrada.</p>
                ) : (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <Card key={session.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            {session.isMentor ? `Mentee: ${session.menteeName}` : `Mentor: ${session.mentorName}`}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(session.date).toLocaleDateString()} às {session.time} - {session.topic}
                          </p>
                        </div>
                        <SessionDetailsModal session={session} />
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <MentorAvailabilitySettings />
        </div>
      </div>
    </ProtectedRoute>
  )
}
