
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database, TablesInsert, TablesUpdate } from "@/lib/types/supabase"

// Constantes de tabela movidas para cá ou lidas do schema
const FEATURE_FLAGS_TABLE = 'feature_flags'
const FEATURE_FLAGS_AUDIT_LOGS_TABLE = 'feature_flag_audit_logs'

// Usar Service Role para bypass RLS nas ações administrativas
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: flags, error: flagsError } = await supabase
      .from(FEATURE_FLAGS_TABLE)
      .select('*')
      .order('name')

    if (flagsError) throw flagsError

    const { data: logs, error: logsError } = await supabase
      .from(FEATURE_FLAGS_AUDIT_LOGS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (logsError) throw logsError

    return NextResponse.json({ flags, logs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, tags } = body

    const insertPayload: TablesInsert<'feature_flags'> = {
      name,
      description,
      tags,
      enabled: false
    }

    const { data, error } = await supabase
      .from(FEATURE_FLAGS_TABLE)
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, enabled, name, performed_by } = body

    const updatePayload: TablesUpdate<'feature_flags'> = {
      enabled,
      updated_at: new Date().toISOString()
    }

    // 1. Atualizar flag
    const { error: updateError } = await supabase
      .from(FEATURE_FLAGS_TABLE)
      .update(updatePayload)
      .eq('id', id)

    if (updateError) throw updateError

    // 2. Gravar Log
    const logPayload: TablesInsert<'feature_flag_audit_logs'> = {
      flag_name: name,
      action: enabled ? 'Ativada' : 'Desativada',
      performed_by: performed_by || 'Sistema'
    }

    await supabase.from(FEATURE_FLAGS_AUDIT_LOGS_TABLE).insert(logPayload)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) throw new Error("ID is required")

    const { error } = await supabase
      .from(FEATURE_FLAGS_TABLE)
      .delete()
      .eq('id', Number(id))

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
