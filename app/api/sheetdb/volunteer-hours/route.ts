import { NextRequest, NextResponse } from 'next/server';

const SHEETDB_API_URL = process.env.NEXT_PUBLIC_SHEETDB_API_URL;
const SHEETDB_API_KEY = process.env.SHEETDB_API_KEY; 

export interface VolunteerHour {
  id?: string;
  name: string;
  email: string;
  date: string;
  hours: number | string; // Pode vir como string do SheetDB
  activity: string;
  description?: string;
  created_at?: string;
}

// GET - Listar horas de voluntariado
export async function GET(request: NextRequest) {
  try {
    if (!SHEETDB_API_URL) {
      return NextResponse.json(
        { error: 'SheetDB API URL não configurada' },
        { status: 500 }
      );
    }

    const response = await fetch(SHEETDB_API_URL, {
      headers: {
        'Authorization': `Bearer ${SHEETDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SheetDB API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar horas de voluntariado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Salvar nova hora de voluntariado
export async function POST(request: NextRequest) {
  try {
    if (!SHEETDB_API_URL) {
      return NextResponse.json(
        { error: 'SheetDB API URL não configurada' },
        { status: 500 }
      );
    }

    const body: VolunteerHour = await request.json();
    
    // Validação básica
    if (!body.name || !body.email || !body.date || !body.hours || !body.activity) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    const volunteerData = {
      ...body,
      created_at: new Date().toISOString(),
    };

    const response = await fetch(SHEETDB_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SHEETDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(volunteerData),
    });

    if (!response.ok) {
      throw new Error(`SheetDB API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar hora de voluntariado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
