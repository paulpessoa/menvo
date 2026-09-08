import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentReminder, sendFeedbackRequest } from '@/lib/email/brevo';

/**
 * Retorna o cliente administrativo do Supabase com service_role para operações agendadas
 */
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Variáveis de ambiente do Supabase (URL / SERVICE_ROLE_KEY) não configuradas.');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });
}

export async function GET(request: Request) {
    try {
        // Validação de segurança: Vercel Cron envia 'Authorization: Bearer <CRON_SECRET>'
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized: CRON_SECRET mismatch' }, { status: 401 });
        }

        const supabase = getAdminClient();
        const now = new Date();
        const results = { reminders: 0, feedbacks: 0, errors: [] as string[] };

        // --- 1. PROCESSAR LEMBRETES DO DIA (Fuso de Brasília / GMT-3) ---
        const nowBR = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);

        const todayStart = new Date(`${nowBR}T00:00:00-03:00`);
        const todayEnd = new Date(`${nowBR}T23:59:59.999-03:00`);

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

        if (remindError) {
            console.error('❌ [CRON] Erro ao buscar mentorias para lembrete:', remindError);
            results.errors.push(`Erro busca lembretes: ${remindError.message}`);
        } else if (toRemind && toRemind.length > 0) {
            for (const app of toRemind) {
                try {
                    // Enviar para o Mentorado
                    if (app.mentee?.email) {
                        await sendAppointmentReminder({
                            userEmail: app.mentee.email,
                            userName: app.mentee.full_name || 'Mentorado',
                            otherPersonName: app.mentor?.full_name || 'Mentor',
                            scheduledAt: app.scheduled_at,
                            meetLink: app.google_meet_link
                        });
                    }

                    // Enviar para o Mentor
                    if (app.mentor?.email) {
                        await sendAppointmentReminder({
                            userEmail: app.mentor.email,
                            userName: app.mentor.full_name || 'Mentor',
                            otherPersonName: app.mentee?.full_name || 'Mentorado',
                            scheduledAt: app.scheduled_at,
                            meetLink: app.google_meet_link
                        });
                    }

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
        // Buscar mentorias finalizadas há pelo menos 1 hora sem pedido de feedback enviado
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

        if (feedbackError) {
            console.error('❌ [CRON] Erro ao buscar mentorias para feedback:', feedbackError);
            results.errors.push(`Erro busca feedback: ${feedbackError.message}`);
        } else if (toFeedback && toFeedback.length > 0) {
            for (const app of toFeedback) {
                const durationMinutes = app.duration_minutes || 45;
                const endTime = new Date(new Date(app.scheduled_at).getTime() + durationMinutes * 60000);

                if (endTime < oneHourAgo) {
                    try {
                        if (app.mentee?.email) {
                            await sendFeedbackRequest({
                                userEmail: app.mentee.email,
                                userName: app.mentee.full_name || 'Mentorado',
                                mentorName: app.mentor?.full_name || 'Mentor',
                                appointmentId: app.id
                            });
                        }

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
            dateBR: nowBR,
            results
        });

    } catch (error: any) {
        console.error('❌ [CRON APPOINTMENTS] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
