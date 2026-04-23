
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Calendar, Clock, Video, Star, Send, 
    ChevronRight, ArrowRight, BookOpen, MessageSquare 
} from "lucide-react"
import Link from "next/link"
import AppointmentsList from "@/components/appointments/AppointmentsList"

export function MenteeMentorshipNewUX() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero / Próxima Mentoria */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F7185] to-[#4191A2] p-8 text-white shadow-lg">
                <div className="relative z-10 space-y-4">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">Próximo Encontro</Badge>
                    <h2 className="text-3xl font-bold tracking-tight">Prepare-se para crescer!</h2>
                    <p className="max-w-md text-white/80">Você tem uma sessão agendada em breve. Revise suas perguntas e aproveite cada minuto.</p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button className="bg-white text-[#0F7185] hover:bg-white/90 font-bold">
                            Ver Detalhes
                        </Button>
                        <Button variant="outline" className="border-white text-white hover:bg-white/10">
                            Meus Objetivos
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
                            Cronograma de Mentorias
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                Aguardando Confirmação
                            </div>
                            <AppointmentsList role="mentee" status="pending" limit={5} />
                        </section>

                        <section className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Confirmadas
                            </div>
                            <AppointmentsList role="mentee" status="confirmed" limit={5} />
                        </section>

                        <section className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider text-muted-foreground/60">
                                Histórico Recente
                            </div>
                            <div className="opacity-70 grayscale-[0.5] transition-all hover:opacity-100 hover:grayscale-0">
                                <AppointmentsList role="mentee" status="completed" limit={3} />
                            </div>
                        </section>
                    </div>
                </div>

                {/* Sidebar: Recursos & Ações */}
                <div className="space-y-6">
                    <Card className="border-primary/20 shadow-sm overflow-hidden group">
                        <div className="h-2 bg-primary"></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                Seja um Mentee Elite
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Complete suas avaliações para ganhar selos de pontualidade e dedicação.
                            </p>
                            <Button className="w-full justify-between" variant="outline">
                                Ver minhas medalhas
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Recursos Úteis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { title: 'Como aproveitar a mentoria', icon: Video },
                                { title: 'Dicas de Networking', icon: MessageSquare },
                                { title: 'Trilha de Carreira', icon: BookOpen },
                            ].map((item, i) => (
                                <Link key={i} href="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors group">
                                    <div className="p-2 rounded bg-white shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium">{item.title}</span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Button asChild className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all">
                        <Link href="/mentors">
                            Explorar Novos Mentores
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
