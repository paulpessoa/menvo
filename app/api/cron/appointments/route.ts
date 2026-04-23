import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentReminder, sendFeedbackRequest } from '@/lib/email/brevo';

// Usar Service Role para bypass RLS nas consultas de admin
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const now = new Date();
        const results = { reminders: 0, feedbacks: 0, errors: [] as string[] };

        // --- 1. PROCESSAR LEMBRETES DO DIA ---
        // Buscar mentorias CONFIRMADAS para hoje que ainda não enviaram lembrete
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: toRemind, error: remindError } = await supabase
            .from('appointments')
            .select(`
                *,
                mentor:profiles!mentor_id(full_name, email),
                mentee:profiles!mentee_id(full_name, email)
            `)
            .eq('status', 'confirmed')
            .is('reminded_at', null)
            .gte('scheduled_at', todayStart.toISOString())
            .lte('scheduled_at', todayEnd.toISOString());

        if (toRemind) {
            for (const app of toRemind) {
                try {
                    // Enviar para o Mentee
                    await sendAppointmentReminder({
                        userEmail: app.mentee.email,
                        userName: app.mentee.full_name,
                        otherPersonName: app.mentor.full_name,
                        scheduledAt: app.scheduled_at,
                        meetLink: app.google_meet_link
                    });
                    
                    // Enviar para o Mentor
                    await sendAppointmentReminder({
                        userEmail: app.mentor.email,
                        userName: app.mentor.full_name,
                        otherPersonName: app.mentee.full_name,
                        scheduledAt: app.scheduled_at,
                        meetLink: app.google_meet_link
                    });

                    // Marcar como lembrado
                    await supabase
                        .from('appointments')
                        .update({ reminded_at: new Date().toISOString() })
                        .eq('id', app.id);
                    
                    results.reminders++;
                } catch (e: any) {
                    results.errors.push(`Erro lembrete ${app.id}: ${e.message}`);
                }
            }
        }

        // --- 2. PROCESSAR PEDIDOS DE FEEDBACK ---
        // Buscar mentorias que terminaram há pelo menos 1 hora e ainda não pediram feedback
        // Consideramos terminada se (scheduled_at + duration) < (agora - 1 hora)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const { data: toFeedback, error: feedbackError } = await supabase
            .from('appointments')
            .select(`
                *,
                mentor:profiles!mentor_id(full_name),
                mentee:profiles!mentee_id(full_name, email)
            `)
            .eq('status', 'confirmed')
            .is('feedback_requested_at', null);

        if (toFeedback) {
            for (const app of toFeedback) {
                const endTime = new Date(new Date(app.scheduled_at).getTime() + (app.duration_minutes || 60) * 60000);
                
                // Se a mentoria já terminou há mais de 1 hora
                if (endTime < oneHourAgo) {
                    try {
                        await sendFeedbackRequest({
                            userEmail: app.mentee.email,
                            userName: app.mentee.full_name,
                            mentorName: app.mentor.full_name,
                            appointmentId: app.id
                        });

                        // Marcar como solicitado
                        await supabase
                            .from('appointments')
                            .update({ feedback_requested_at: new Date().toISOString() })
                            .eq('id', app.id);

                        results.feedbacks++;
                    } catch (e: any) {
                        results.errors.push(`Erro feedback ${app.id}: ${e.message}`);
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            timestamp: now.toISOString(),
            results 
        });

    } catch (error: any) {
        console.error('❌ [CRON APPOINTMENTS] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
