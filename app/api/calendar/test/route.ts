import { NextResponse } from 'next/server';
import { createCalendarEvent, isGoogleCalendarConfigured, getMissingEnvVars } from '@/lib/services/google-calendar.service';

export async function POST() {
  try {
    // Verificar se está configurado
    if (!isGoogleCalendarConfigured()) {
      const missing = getMissingEnvVars();
      return NextResponse.json(
        {
          success: false,
          error: 'Google Calendar não configurado',
          missingEnvVars: missing,
          instructions: [
            '1. Configure as variáveis de ambiente no .env.local',
            '2. Execute: node scripts/generate-refresh-token.js',
            '3. Adicione o refresh_token no .env.local',
            '4. Reinicie o servidor',
          ],
        },
        { status: 400 }
      );
    }

    // Criar evento de teste
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora a partir de agora
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas a partir de agora

    const eventData = {
      summary: '🧪 Teste de Integração - MENVO Calendar',
      description: `Este é um evento de teste criado pela integração do MENVO com Google Calendar.

📅 Criado em: ${now.toLocaleString('pt-BR')}
🔧 Ambiente: ${process.env.NODE_ENV || 'development'}

Se você está vendo este evento, significa que a integração está funcionando corretamente! ✅

Você pode deletar este evento com segurança.`,
      startTime,
      endTime,
      mentorEmail: process.env.GOOGLE_CALENDAR_TEST_EMAIL || 'test@example.com',
      mentorName: 'Mentor Teste',
      menteeEmail: process.env.GOOGLE_CALENDAR_TEST_EMAIL || 'test@example.com',
      menteeName: 'Mentee Teste',
    };

    const result = await createCalendarEvent(eventData);

    return NextResponse.json({
      success: true,
      message: 'Evento de teste criado com sucesso!',
      event: {
        id: result.eventId,
        htmlLink: result.calendarLink,
        hangoutLink: result.meetLink,
      },
      instructions: [
        '✅ Verifique seu Google Calendar',
        '✅ O evento deve aparecer com link do Google Meet',
        '✅ Você pode deletar este evento de teste',
      ],
    });

  } catch (error) {
    console.error('Error creating test event:', error);

    let errorMessage = 'Erro desconhecido';
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        troubleshooting: [
          'Verifique se todas as variáveis de ambiente estão configuradas',
          'Verifique se o refresh_token é válido',
          'Execute: node scripts/generate-refresh-token.js para gerar novo token',
          'Verifique os logs do servidor para mais detalhes',
        ],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const configured = isGoogleCalendarConfigured();
  const missing = getMissingEnvVars();

  return NextResponse.json({
    message: 'Google Calendar API test endpoint',
    configured,
    missingEnvVars: missing,
    instructions: {
      test: 'Send a POST request to this endpoint to create a test event',
      setup: 'Run: node scripts/generate-refresh-token.js',
      docs: 'See: /GUIA_SETUP_GOOGLE_CALENDAR.md',
    },
  });
}