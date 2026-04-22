'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import { AppointmentWithProfiles } from '@/lib/types/models/mentorship';
import { toast } from 'sonner';
import { AppointmentCard } from './appointment-card';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations("appointments");
    const [appointments, setAppointments] = useState<AppointmentWithProfiles[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const fetchAppointments = useCallback(async () => {
        if (!user) return;

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
            toast.error(t("error"));
        } finally {
            setLoading(false);
        }
    }, [role, status, limit, user, t]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchAppointments();
        }
    }, [user, authLoading, fetchAppointments]);

    if (authLoading || (loading && appointments.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">{t("empty")}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment.id}
                    appointment={appointment as any}
                    currentUserId={user?.id || ''}
                    onAppointmentUpdate={fetchAppointments as any}
                />
            ))}
        </div>
    );
}
