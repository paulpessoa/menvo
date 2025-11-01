'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { AppointmentWithProfiles } from '@/types/appointments';
import { toast } from 'sonner';
import { AppointmentCard } from './appointment-card';
import { createClient } from '@/utils/supabase/client';

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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchUser();
        fetchAppointments();
    }, [role, status, limit]);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

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

    if (!currentUserId) {
        return null;
    }

    return (
        <div className="space-y-4">
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    currentUserId={currentUserId}
                    onAppointmentUpdate={fetchAppointments}
                />
            ))}
        </div>
    );
}
