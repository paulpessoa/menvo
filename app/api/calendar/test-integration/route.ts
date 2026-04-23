
import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent, getMissingEnvVars } from "@/lib/services/mentorship/google-calendar.service";

export async function POST(request: NextRequest) {
  try {
    const missing = getMissingEnvVars();
    const envStatus = {
      GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
      GOOGLE_CALENDAR_CLIENT_SECRET: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      GOOGLE_CALENDAR_REFRESH_TOKEN: !!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      GOOGLE_CALENDAR_REDIRECT_URI: process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'Não definido',
      NODE_ENV: process.env.NODE_ENV
    };

    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Variáveis de ambiente faltando",
        env: envStatus,
        details: missing
      }, { status: 400 });
    }

    const testData = {
      summary: '🛠️ MENVO DEBUG: Teste de Sistema',
      description: 'Este é um evento de teste gerado pela página de diagnóstico. Pode ser excluído.',
      startTime: new Date(Date.now() + 3600000), // +1h
      endTime: new Date(Date.now() + 5400000),   // +1.5h
      mentorEmail: 'teste-mentor@menvo.com.br',
      mentorName: 'Diagnóstico Mentor',
      menteeEmail: 'teste-mentee@menvo.com.br',
      menteeName: 'Diagnóstico Mentee'
    };

    console.log("🚀 [DEBUG] Iniciando teste de criação de evento...");
    const response = await createCalendarEvent(testData);

    return NextResponse.json({
      success: true,
      env: envStatus,
      response
    });

  } catch (error: any) {
    console.error("❌ [DEBUG] Falha no teste de integração:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message || "Erro desconhecido",
      env: {
        GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
        GOOGLE_CALENDAR_CLIENT_SECRET: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        GOOGLE_CALENDAR_REFRESH_TOKEN: !!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      },
      details: error.response?.data || error.stack || "Sem detalhes adicionais"
    }, { status: 500 });
  }
}
