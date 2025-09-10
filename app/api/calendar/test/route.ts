import { NextResponse } from 'next/server';
import { createUserGoogleCalendarClient } from '@/lib/google-calendar-db';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Obter cliente do Google Calendar do usuário
    const { calendar } = await createUserGoogleCalendarClient(user.id);

    // Criar evento de teste
    const testEvent = {
      summary: 'Teste de Integração - Google Calendar',
      description: 'Este é um evento de teste criado pela integração do MENVO com Google Calendar.',
      start: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        {
          email: user.email || 'test@example.com',
          displayName: user.user_metadata?.full_name || 'Usuário Teste',
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: testEvent,
    });

    const event = response.data;

    return NextResponse.json({
      success: true,
      message: 'Evento de teste criado com sucesso!',
      event: {
        id: event.id,
        htmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink,
        conferenceData: event.conferenceData,
      },
    });
  } catch (error) {
    console.error('Error creating test event:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Calendar API test endpoint',
    instructions: 'Send a POST request to create a test event',
  });
}