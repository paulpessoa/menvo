import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
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

        // Construir query
        let query = supabase
            .from('appointments')
            .select(`
                *,
                mentor:profiles!appointments_mentor_id_fkey(
                    id,
                    full_name,
                    email,
                    avatar_url
                ),
                mentee:profiles!appointments_mentee_id_fkey(
                    id,
                    full_name,
                    email,
                    avatar_url
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
