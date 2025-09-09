'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Calendar,
    Clock,
    User,
    Video,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink
} from 'lucide-react';
import { AppointmentWithProfiles } from '@/types/appointments';
import { toast } from 'sonner';

interface AppointmentsListProps {
    role?: 'mentor' | 'mentee';
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    limit?: number;
}

export default function AppointmentsList({
    role,
    status,
    limit = 10
}: AppointmentsListProps) {
    const [appointments, setAppointments] = useState<AppointmentWithProfiles[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, [role, status, limit]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (role) params.append('role', role);
            if (status) params.append('status', status);
            params.append('limit', limit.toString());

            const response = await fetch(`/api/appointments/list?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }

            const data = await response.json();
            setAppointments(data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            toast.error('Erro ao carregar agendamentos');
        } finally {
            setLoading(false);
        }
    };

    const updateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
        try {
            setUpdating(appointmentId);

            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update appointment');
            }

            toast.success('Agendamento atualizado com sucesso');
            fetchAppointments(); // Refresh the list
        } catch (error) {
            console.error('Error updating appointment:', error);
            toast.error('Erro ao atualizar agendamento');
        } finally {
            setUpdating(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { variant: 'secondary' as const, icon: AlertCircle, label: 'Pendente' },
            confirmed: { variant: 'default' as const, icon: CheckCircle, label: 'Confirmado' },
            cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelado' },
            completed: { variant: 'outline' as const, icon: CheckCircle, label: 'Concluído' },
        };

        const config = variants[status as keyof typeof variants] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            }),
            time: date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    };

    const getPersonInfo = (appointment: AppointmentWithProfiles, currentRole?: string) => {
        // If role is specified, show the other person
        if (currentRole === 'mentor') {
            return {
                person: appointment.mentee,
                label: 'Mentee',
            };
        } else if (currentRole === 'mentee') {
            return {
                person: appointment.mentor,
                label: 'Mentor',
            };
        }

        // If no role specified, determine based on context
        // This would need user context to determine which person to show
        return {
            person: appointment.mentor,
            label: 'Mentor',
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.scheduled_at);
                const { person, label } = getPersonInfo(appointment, role);
                const isUpcoming = new Date(appointment.scheduled_at) > new Date();
                const canConfirm = appointment.status === 'pending' && role === 'mentor';
                const canCancel = ['pending', 'confirmed'].includes(appointment.status) && isUpcoming;

                return (
                    <Card key={appointment.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Avatar */}
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={person.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {person.first_name?.[0]}{person.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Details */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">
                                                {person.full_name || `${person.first_name} ${person.last_name}`}
                                            </h3>
                                            <span className="text-sm text-muted-foreground">({label})</span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {date}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {time}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {appointment.duration_minutes} min
                                            </div>
                                        </div>

                                        {appointment.notes && (
                                            <div className="flex items-start gap-1 text-sm">
                                                <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <p className="text-muted-foreground">{appointment.notes}</p>
                                            </div>
                                        )}

                                        {appointment.google_meet_link && appointment.status === 'confirmed' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(appointment.google_meet_link, '_blank')}
                                                >
                                                    <Video className="h-4 w-4 mr-2" />
                                                    Entrar na Reunião
                                                    <ExternalLink className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status and Actions */}
                                <div className="flex flex-col items-end gap-3">
                                    {getStatusBadge(appointment.status)}

                                    <div className="flex gap-2">
                                        {canConfirm && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                                disabled={updating === appointment.id}
                                            >
                                                {updating === appointment.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Confirmar
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {canCancel && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                                disabled={updating === appointment.id}
                                            >
                                                {updating === appointment.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Cancelar
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
