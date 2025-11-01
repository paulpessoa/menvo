"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import AppointmentsList from "@/components/appointments/AppointmentsList"

export default function MenteeMentorshipPage() {
    return (
        <RequireRole roles={['mentee']}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/mentee">
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
                            Acompanhe suas solicitações e sessões de mentoria agendadas
                        </p>
                    </div>

                    {/* Tabs de Mentorias */}
                    <Tabs defaultValue="solicitacoes" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="solicitacoes" className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Minhas Solicitações
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
                        <TabsContent value="solicitacoes" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Solicitações Enviadas</CardTitle>
                                    <CardDescription>
                                        Aguardando confirmação dos mentores
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsList role="mentee" status="pending" limit={20} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Mentorias Confirmadas */}
                        <TabsContent value="confirmadas" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mentorias Agendadas</CardTitle>
                                    <CardDescription>
                                        Sessões confirmadas pelos mentores. Após a mentoria, clique em "Avaliar" para deixar seu feedback.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppointmentsList role="mentee" status="confirmed" limit={20} />
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
                                    <AppointmentsList role="mentee" status="completed" limit={20} />
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
                                    <AppointmentsList role="mentee" status="cancelled" limit={20} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Recursos de Aprendizado - Em Desenvolvimento */}
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Recursos de Aprendizado</CardTitle>
                            <CardDescription>
                                Materiais e conteúdos recomendados pelos seus mentores
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm italic">Em desenvolvimento</p>
                                <p className="text-xs mt-2">
                                    Em breve: biblioteca de recursos, materiais compartilhados e recomendações personalizadas
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireRole>
    )
}
