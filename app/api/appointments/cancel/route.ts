import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { cancelAppointmentSchema } from '@/lib/schemas/appointment';
import { buildAppointmentsService } from '@/lib/services/appointments/appointments.composition';
import { RepositoryError } from '@/lib/repositories/repository-error';
import { transitionBlockedResponse } from '../transition-response';

/**
 * Mentor ou mentorado cancela uma sessão, com motivo.
 *
 * Fino de propósito: auth -> Zod -> `appointments.service` -> status HTTP. A
 * regra "só quem participa cancela" (PR #109) está no service e tem teste lá e
 * aqui; quem não participa recebe 404, igual a um id que não existe.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = cancelAppointmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dados inválidos para cancelamento' },
        { status: 400 }
      );
    }

    const { appointmentId, reason } = parseResult.data;

    const result = await buildAppointmentsService().cancel(appointmentId, user.id, reason);
    switch (result.kind) {
      case 'ok':
        return NextResponse.json({ success: true, message: 'Agendamento cancelado com sucesso' });
      case 'not_found':
        return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
      case 'already_cancelled':
        return NextResponse.json({ error: 'Agendamento já foi cancelado' }, { status: 400 });
      case 'forbidden':
        return NextResponse.json(
          { error: 'Apenas o mentor pode cancelar uma sessão já concluída' },
          { status: 403 }
        );
      default:
        return transitionBlockedResponse(result);
    }
  } catch (error) {
    console.error('[CANCEL] Erro inesperado:', error);
    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Erro ao cancelar agendamento', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
