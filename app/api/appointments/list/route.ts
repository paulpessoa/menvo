import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role';

export async function GET(request: NextRequest) {
    try {
        const serverSupabase = await createServerClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Pegar parâmetros da query
        const searchParams = request.nextUrl.searchParams;
        const role = searchParams.get('role'); // 'mentor' ou 'mentee'
        const status = searchParams.get('status'); // 'pending', 'confirmed', 'cancelled', 'completed'
        const limit = parseInt(searchParams.get('limit') || '10');

        // Usamos o client de service role só para esta leitura: a query abaixo
        // sempre filtra por mentor_id = user.id OU mentee_id = user.id (nunca
        // vaza agendamentos de terceiros), mas o embed profiles!mentor_id /
        // profiles!mentee_id do PostgREST aplica a RLS de `profiles` na OUTRA
        // ponta do agendamento. Se essa pessoa não tiver o perfil marcado como
        // público, o embed silenciosamente vira `null` em vez de dar erro —
        // e o ChatButton client-side quebra a página inteira lendo
        // `otherPerson.full_name` de null. Ter marcado um horário juntos já
        // autoriza cada lado a ver o nome/avatar básico do outro.
        const supabase = createServiceRoleClient()

        // Construir query
        let query = supabase
            .from('appointments')
            .select(`
                *,
                mentor:profiles!mentor_id(
                    id,
                    full_name,
                    email,
                    avatar_url,
                    linkedin_url
                ),
                mentee:profiles!mentee_id(
                    id,
                    full_name,
                    email,
                    avatar_url,
                    linkedin_url
                ),
                feedbacks:appointment_feedbacks(
                    id,
                    reviewer_id
                )
            `)
            .order('scheduled_at', { ascending: false })
            .limit(limit);

        // Filtrar por papel (mentor ou mentee)
        if (role === 'mentor') {
            query = query.eq('mentor_id', user.id);
        } else if (role === 'mentee') {
            query = query.eq('mentee_id', user.id);
        } else {
            // Se não especificado, buscar onde o usuário é mentor OU mentee
            query = query.or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);
        }

        // Filtrar por status
        if (status) {
            query = query.eq('status', status);
        }

        const { data: appointments, error } = await query;

        if (error) {
            console.error('Error fetching appointments:', error);
            return NextResponse.json(
                { error: 'Erro ao buscar agendamentos' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            appointments: appointments || [],
            count: appointments?.length || 0
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
