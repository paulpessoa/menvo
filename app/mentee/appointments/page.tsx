'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import { Calendar, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MenteeAppointmentsPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Meus Agendamentos</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas sessões de mentoria agendadas
                    </p>
                </div>

                <Button onClick={() => router.push('/mentors')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                </Button>
            </div>

            {/* Appointments Tabs */}
            <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upcoming" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Próximos
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Pendentes
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Concluídos
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Cancelados
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                    <Card>
                        <CardHeader>
                            <CardTitle>Próximos Agendamentos</CardTitle>
                            <CardDescription>
                                Suas sessões de mentoria confirmadas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppointmentsList
                                role="mentee"
                                status="confirmed"
                                limit={20}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agendamentos Pendentes</CardTitle>
                            <CardDescription>
                                Aguardando confirmação do mentor
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppointmentsList
                                role="mentee"
                                status="pending"
                                limit={20}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sessões Concluídas</CardTitle>
                            <CardDescription>
                                Histórico das suas mentorias
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppointmentsList
                                role="mentee"
                                status="completed"
                                limit={50}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cancelled">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agendamentos Cancelados</CardTitle>
                            <CardDescription>
                                Sessões que foram canceladas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppointmentsList
                                role="mentee"
                                status="cancelled"
                                limit={20}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}