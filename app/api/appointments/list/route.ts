import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { listAppointmentsQuerySchema } from '@/lib/schemas/appointment';
import { buildAppointmentsService } from '@/lib/services/appointments/appointments.composition';

/**
 * Sessões do usuário logado (como mentor, mentorado ou ambos).
 *
 * A consulta sempre filtra por `mentor_id = user.id` ou `mentee_id = user.id`
 * (nunca vaza sessão de terceiros) e roda com o client escolhido em
 * `appointments.composition.ts`, hoje `service_role` (temporário, ADR 0008).
 * O motivo é o embed de `profiles` da OUTRA ponta: com o client do usuário a
 * RLS de `profiles` o transforma em `null` quando a pessoa não tem perfil
 * público, e o `ChatButton` quebra a página lendo `otherPerson.full_name`.
 * Ter marcado um horário juntos já autoriza cada lado a ver nome e avatar do outro.
 */
export async function GET(request: NextRequest) {
    try {
        const serverSupabase = await createServerClient();

        const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const params = request.nextUrl.searchParams;
        const query = listAppointmentsQuerySchema.safeParse({
            role: params.get('role') || undefined,
            status: params.get('status') || undefined,
            limit: params.get('limit') || undefined
        });
        if (!query.success) {
            return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
        }

        const appointments = await buildAppointmentsService().listMine({ userId: user.id, ...query.data });

        return NextResponse.json({ appointments, count: appointments.length });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
    }
}
