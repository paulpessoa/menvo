'use client';

import { MenvoLoader } from "@/components/ui/menvo-loader";
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useMentor } from '@/hooks/mentors/useMentor';
import BookingForm from '@/components/appointments/BookingForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

export default function BookAppointmentPage() {
    const params = useParams();
    const router = useRouter();
    const mentorId = params.mentorId as string;

    const { data: mentor, isPending: loading, isError } = useMentor(mentorId);
    const error = isError ? 'Mentor não encontrado' : null;

    const handleBookingSuccess = (appointmentId: string) => {
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
                    <MenvoLoader />
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
                mentorId={mentor.id ?? mentorId}
                mentorName={mentor.full_name || `${mentor.first_name} ${mentor.last_name}`}
                onSuccess={handleBookingSuccess}
                onCancel={handleCancel}
            />
        </div>
    );
}