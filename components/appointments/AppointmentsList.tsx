'use client';

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from "lucide-react";
import { useAppointmentsList } from '@/hooks/appointments/useAppointmentsList';
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
    const { user, loading: authLoading } = useAuth();
    const { data, isLoading: loading, isError, refetch } = useAppointmentsList({ role, status, limit });
    const appointments = data ?? [];

    useEffect(() => {
        if (isError) toast.error(t("error"));
    }, [isError, t]);

    if (authLoading || (loading && appointments.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <MenvoDots />
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
                    appointment={appointment}
                    currentUserId={user?.id || ''}
                    onAppointmentUpdate={() => { void refetch() }}
                />
            ))}
        </div>
    );
}
