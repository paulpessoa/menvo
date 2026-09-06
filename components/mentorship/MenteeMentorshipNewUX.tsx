
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Calendar, Clock, Video, Star, Send, 
    ChevronRight, ArrowRight, BookOpen, MessageSquare 
} from "lucide-react"
import { Link } from "@/i18n/routing"
import AppointmentsList from "@/components/appointments/AppointmentsList"
import { useTranslations } from "next-intl"

export function MenteeMentorshipNewUX() {
    const t = useTranslations("mentorship.newUx")

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero / Próxima Mentoria */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-lg">
                <div className="relative z-10 space-y-4">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 font-semibold rounded-lg">
                        {t("nextMeeting")}
                    </Badge>
                    <h2 className="text-3xl font-black tracking-tight">{t("heroTitle")}</h2>
                    <p className="max-w-md text-white/90 leading-relaxed text-sm md:text-base">
                        {t("heroDesc")}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button className="bg-white text-indigo-700 hover:bg-white/90 font-bold shadow-md rounded-xl border-none">
                            {t("viewDetails")}
                        </Button>
                        <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm rounded-xl font-bold">
                            {t("myGoals")}
                        </Button>
                    </div>
                </div>
                <Calendar className="absolute -right-10 -bottom-10 h-64 w-64 text-white/10 rotate-12" />
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
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                {t("awaitingConfirmation")}
                            </div>
                            <AppointmentsList role="mentee" status="pending" limit={5} />
                        </section>

                        <section className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {t("confirmed")}
                            </div>
                            <AppointmentsList role="mentee" status="confirmed" limit={5} />
                        </section>

                        <section className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider text-muted-foreground/60">
                                {t("recentHistory")}
                            </div>
                            <div className="opacity-70 grayscale-[0.5] transition-all hover:opacity-100 hover:grayscale-0">
                                <AppointmentsList role="mentee" status="completed" limit={3} />
                            </div>
                        </section>
                    </div>
                </div>

                {/* Sidebar: Recursos & Ações */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border-primary/20 shadow-xs overflow-hidden group">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                {t("eliteTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t("eliteDesc")}
                            </p>
                            <Button className="w-full justify-between rounded-xl font-semibold" variant="outline">
                                {t("viewBadges")}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl bg-muted/30 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                {t("usefulResources")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { title: t("howToLeverage"), icon: Video },
                                { title: t("networkingTips"), icon: MessageSquare },
                                { title: t("careerTrack"), icon: BookOpen },
                            ].map((item, i) => (
                                <Link key={i} href="#" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors group">
                                    <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium">{item.title}</span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Button asChild className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all text-base">
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
