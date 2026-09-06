"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, CheckCircle, Clock, XCircle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import AppointmentsList from "@/components/appointments/AppointmentsList"
import { MenteeMentorshipNewUX } from "@/components/mentorship/MenteeMentorshipNewUX"
import { useFeatureFlag } from "@/lib/feature-flags"
import { useTranslations } from "next-intl"

export default function MenteeMentorshipPage() {
    const isNewUXEnabled = useFeatureFlag('new_mentorship_flag')
    const t = useTranslations("mentorship")

    return (
        <RequireRole roles={['mentee']}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="rounded-xl font-medium">
                        <Link href="/dashboard/mentee">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t("menteePage.backToDashboard")}
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">{t("menteePage.title")}</h1>
                        <p className="text-muted-foreground">
                            {t("menteePage.description")}
                        </p>
                    </div>

                    {isNewUXEnabled ? (
                        <MenteeMentorshipNewUX />
                    ) : (
                        /* Tabs de Mentorias (Interface Antiga) */
                        <Tabs defaultValue="solicitacoes" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 rounded-xl">
                                <TabsTrigger value="solicitacoes" className="flex items-center gap-2 rounded-lg">
                                    <Send className="h-4 w-4" />
                                    {t("requested.pending")}
                                </TabsTrigger>
                                <TabsTrigger value="confirmadas" className="flex items-center gap-2 rounded-lg">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("tabs.confirmed")}
                                </TabsTrigger>
                                <TabsTrigger value="avaliadas" className="flex items-center gap-2 rounded-lg">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("tabs.completed")}
                                </TabsTrigger>
                                <TabsTrigger value="canceladas" className="flex items-center gap-2 rounded-lg">
                                    <XCircle className="h-4 w-4" />
                                    {t("tabs.cancelled")}
                                </TabsTrigger>
                            </TabsList>

                            {/* Solicitações Pendentes */}
                            <TabsContent value="solicitacoes" className="space-y-4">
                                <Card className="rounded-2xl border border-gray-100 shadow-xs">
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

                            {/* Mentorias Confirmadas */}
                            <TabsContent value="confirmadas" className="space-y-4">
                                <Card className="rounded-2xl border border-gray-100 shadow-xs">
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

                            {/* Mentorias Avaliadas */}
                            <TabsContent value="avaliadas" className="space-y-4">
                                <Card className="rounded-2xl border border-gray-100 shadow-xs">
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

                            {/* Mentorias Canceladas */}
                            <TabsContent value="canceladas" className="space-y-4">
                                <Card className="rounded-2xl border border-gray-100 shadow-xs">
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
                    )}

                    {/* Recursos de Aprendizado */}
                    {!isNewUXEnabled && (
                        <Card className="bg-muted/50 rounded-2xl border border-gray-100">
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
                    )}
                </div>
            </div>
        </RequireRole>
    )
}
