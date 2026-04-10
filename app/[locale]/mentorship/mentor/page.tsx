"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Inbox, CheckCircle, Clock, XCircle, Send } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import AppointmentsList from "@/components/appointments/AppointmentsList"
import { useTranslations } from "next-intl"

export default function MentorMentorshipPage() {
    const t = useTranslations("mentorship")

    return (
        <RequireRole roles={['mentor']}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/mentor">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t("received.confirmedDesc").includes("Avaliar") ? "Voltar ao Dashboard" : "Back to Dashboard"}
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">{t("title")}</h1>
                        <p className="text-muted-foreground">
                            {t("description")}
                        </p>
                    </div>

                    {/* Mentorias Recebidas (como Mentor) */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Inbox className="h-5 w-5 text-indigo-600" />
                            {t("received.title")}
                            <span className="text-sm font-normal text-muted-foreground">{t("received.asMentor")}</span>
                        </h2>

                        <Tabs defaultValue="pendentes" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="pendentes" className="flex items-center gap-2">
                                    <Inbox className="h-4 w-4" />
                                    {t("tabs.pending")}
                                </TabsTrigger>
                                <TabsTrigger value="confirmadas" className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("tabs.confirmed")}
                                </TabsTrigger>
                                <TabsTrigger value="avaliadas" className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("tabs.completed")}
                                </TabsTrigger>
                                <TabsTrigger value="canceladas" className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    {t("tabs.cancelled")}
                                </TabsTrigger>
                            </TabsList>

                            {/* Solicitações Pendentes */}
                            <TabsContent value="pendentes" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t("received.pending")}</CardTitle>
                                        <CardDescription>
                                            {t("received.pendingDesc")}
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
                                        <CardTitle>{t("received.confirmed")}</CardTitle>
                                        <CardDescription>
                                            {t("received.confirmedDesc")}
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
                                        <CardTitle>{t("received.completed")}</CardTitle>
                                        <CardDescription>
                                            {t("received.completedDesc")}
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
                                        <CardTitle>{t("received.cancelled")}</CardTitle>
                                        <CardDescription>
                                            {t("received.cancelledDesc")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AppointmentsList role="mentor" status="cancelled" limit={20} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                        </Tabs>
                    </div>

                    {/* Mentorias Solicitadas (como Mentee) */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-600" />
                            {t("requested.title")}
                            <span className="text-sm font-normal text-muted-foreground">{t("requested.asMentee")}</span>
                        </h2>

                        <Tabs defaultValue="pendentes-solicitadas" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="pendentes-solicitadas" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {t("tabs.pending")}
                                </TabsTrigger>
                                <TabsTrigger value="confirmadas-solicitadas" className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("tabs.confirmed")}
                                </TabsTrigger>
                                <TabsTrigger value="avaliadas-solicitadas" className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("tabs.completed")}
                                </TabsTrigger>
                                <TabsTrigger value="canceladas-solicitadas" className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    {t("tabs.cancelled")}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="pendentes-solicitadas" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t("requested.pending")}</CardTitle>
                                        <CardDescription>
                                            {t("requested.pendingDesc")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AppointmentsList role="mentee" status="pending" limit={20} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="confirmadas-solicitadas" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t("requested.confirmed")}</CardTitle>
                                        <CardDescription>
                                            {t("requested.confirmedDesc")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AppointmentsList role="mentee" status="confirmed" limit={20} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="avaliadas-solicitadas" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t("requested.completed")}</CardTitle>
                                        <CardDescription>
                                            {t("requested.completedDesc")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AppointmentsList role="mentee" status="completed" limit={20} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="canceladas-solicitadas" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t("requested.cancelled")}</CardTitle>
                                        <CardDescription>
                                            {t("requested.cancelledDesc")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AppointmentsList role="mentee" status="cancelled" limit={20} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Recursos e Materiais */}
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>{t("resources.title")}</CardTitle>
                            <CardDescription>
                                {t("resources.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm italic">{t("resources.inDevelopment")}</p>
                                <p className="text-xs mt-2">
                                    {t("resources.comingSoon")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireRole>
    )
}