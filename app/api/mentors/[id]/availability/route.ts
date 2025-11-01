import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Usar Service Role para permitir leitura pública da disponibilidade
    // A disponibilidade dos mentores deve ser visível para todos
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const mentorId = params.id;

    // Buscar disponibilidade do mentor
    const { data: availability, error } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      console.error('[AVAILABILITY] Erro ao buscar:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar disponibilidade' },
        { status: 500 }
      );
    }

    return NextResponse.json(availability || []);
  } catch (error) {
    console.error('[AVAILABILITY] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
