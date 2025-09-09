'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import BookingForm from '@/components/appointments/BookingForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

interface MentorProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url?: string;
    verified: boolean;
}

export default function BookAppointmentPage() {
    const params = useParams();
    const router = useRouter();
    const mentorId = params.mentorId as string;

    const [mentor, setMentor] = useState<MentorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                const supabase = createClient();

                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, email, first_name, last_name, full_name, avatar_url, verified')
                    .eq('id', mentorId)
                    .single();

                if (error) {
                    throw error;
                }

                if (!data.verified) {
                    setError('Este mentor ainda não foi verificado');
                    return;
                }

                setMentor(data);
            } catch (error) {
                console.error('Error fetching mentor:', error);
                setError('Mentor não encontrado');
            } finally {
                setLoading(false);
            }
        };

        if (mentorId) {
            fetchMentor();
        }
    }, [mentorId]);

    const handleBookingSuccess = (appointmentId: number) => {
        toast.success('Agendamento criado com sucesso!');
        router.push('/dashboard/mentee');
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error || !mentor) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-md mx-auto">
                    <CardContent className="text-center py-8">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-semibold mb-2">Mentor não disponível</h2>
                        <p className="text-muted-foreground mb-4">
                            {error || 'Mentor não encontrado'}
                        </p>
                        <Button onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Agendar Mentoria</h1>
                    <p className="text-muted-foreground">
                        Escolha um horário disponível para sua sessão de mentoria
                    </p>
                </div>
            </div>

            {/* Booking Form */}
            <BookingForm
                mentorId={mentor.id}
                mentorName={mentor.full_name || `${mentor.first_name} ${mentor.last_name}`}
                onSuccess={handleBookingSuccess}
                onCancel={handleCancel}
            />
        </div>
    );
}
