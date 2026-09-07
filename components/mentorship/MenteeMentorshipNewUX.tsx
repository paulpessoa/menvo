
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Video, ArrowRight, Calendar } from "lucide-react"
import { Link } from "@/i18n/routing"
import AppointmentsList from "@/components/appointments/AppointmentsList"
import { useTranslations } from "next-intl"

export function MenteeMentorshipNewUX() {
    const t = useTranslations("mentorship.newUx")

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Banner de Próxima Sessão / Boas-vindas com a paleta oficial da Menvo */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-primary-700 via-primary-600 to-primary text-white p-8 md:p-10 shadow-xl shadow-primary/20">
                <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/15 text-white border-none py-1 px-3.5 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("nextMeeting")}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t("heroTitle")}</h2>
                    <p className="max-w-xl text-white/90 leading-relaxed text-sm md:text-base">
                        {t("heroDesc")}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button asChild className="bg-white text-primary hover:bg-white/95 font-bold shadow-md rounded-xl border-none h-11 px-6">
                            <Link href="/mentors">
                                {t("exploreMentors")}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-xl font-bold h-11 px-6">
                            <Link href="/community">
                                Explorar Comunidade
                            </Link>
                        </Button>
                    </div>
                </div>
                {/* Ambient glow decoration */}
                <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline de Mentorias */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            {t("timelineTitle")}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                {t("awaitingConfirmation")}
                            </div>
                            <AppointmentsList role="mentee" status="pending" limit={5} />
                        </section>

                        <section className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {t("confirmed")}
                            </div>
                            <AppointmentsList role="mentee" status="confirmed" limit={5} />
                        </section>

                        <section className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider text-muted-foreground/60">
                                {t("recentHistory")}
                            </div>
                            <div className="opacity-80 transition-all hover:opacity-100">
                                <AppointmentsList role="mentee" status="completed" limit={3} />
                            </div>
                        </section>
                    </div>
                </div>

                {/* Sidebar: Ação e Dicas */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border-primary/20 shadow-xs overflow-hidden">
                        <div className="h-2 bg-primary"></div>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                <Video className="h-5 w-5 text-primary" />
                                Como funciona sua sessão
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                            <p>
                                Suas mentorias confirmadas acontecem 100% online via <strong>Google Meet</strong>. O link da chamada é gerado automaticamente e liberado nos detalhes do agendamento.
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                                Lembre-se de entrar com 5 minutos de antecedência e preparar seus principais objetivos.
                            </p>
                        </CardContent>
                    </Card>

                    <Button asChild className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all text-base">
                        <Link href="/mentors">
                            {t("exploreMentors")}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
