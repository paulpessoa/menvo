"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Inbox, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import AppointmentsList from "@/components/appointments/AppointmentsList"
import { BarChart } from "recharts"

export default function MentorMentorshipPage() {
    return (
        <RequireRole roles={['mentor']}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/mentor">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar ao Dashboard
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">Minhas Mentorias</h1>
                        <p className="text-muted-foreground">
                            Gerencie solicitações recebidas e suas sessões de mentoria
                        </p>
                    </div>

                    {/* Tabs de Mentorias */}
                    <Tabs defaultValue="pendentes" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="pendentes" className="flex items-center gap-2">
                                <Inbox className="h-4 w-4" />
                                Pendentes
                            </TabsTrigger>
                            <TabsTrigger value="confirmadas" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Agendadas
                            </TabsTrigger>
                            <TabsTrigger value="avaliadas" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Avaliadas
                            </TabsTrigger>
                            <TabsTrigger value="canceladas" className="flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Canceladas
                            </TabsTrigger>
                        </TabsList>

                        {/* Solicitações Pendentes */}
                        <TabsContent value="pendentes" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pedidos Recebidos</CardTitle>
                                    <CardDescription>
                                        Solicitações de mentoria aguardando sua confirmação
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsList role="mentor" status="pending" limit={20} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Mentorias Confirmadas */}
                        <TabsContent value="confirmadas" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mentorias Agendadas</CardTitle>
                                    <CardDescription>
                                        Sessões confirmadas e agendadas. Após a mentoria, clique em "Avaliar" para deixar seu feedback.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsList role="mentor" status="confirmed" limit={20} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Mentorias Avaliadas */}
                        <TabsContent value="avaliadas" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mentorias Avaliadas</CardTitle>
                                    <CardDescription>
                                        Sessões finalizadas com feedback registrado
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsList role="mentor" status="completed" limit={20} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Mentorias Canceladas */}
                        <TabsContent value="canceladas" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sessões Canceladas</CardTitle>
                                    <CardDescription>
                                        Mentorias que foram canceladas
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsList role="mentor" status="cancelled" limit={20} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Recursos e Materiais - Em Desenvolvimento */}
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Biblioteca de Recursos</CardTitle>
                            <CardDescription>
                                Compartilhe materiais e recursos com seus mentees
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm italic">Em desenvolvimento</p>
                                <p className="text-xs mt-2">
                                    Em breve: biblioteca de materiais, templates e recursos para compartilhar com mentees
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireRole>
    )
}
