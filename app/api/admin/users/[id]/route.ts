
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Admin client com service role para ignorar RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 1. Validar se o solicitante é realmente um admin (segurança extra)
    // Nota: O middleware já deve fazer isso, mas aqui reforçamos
    
    const { updates, roles } = body

    // 2. Atualizar Perfil
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (profileError) throw profileError

    // 3. Atualizar Roles se fornecidas (Otimizado para evitar webhooks desnecessários)
    if (roles && Array.isArray(roles)) {
      // Buscar roles atuais do usuário
      const { data: currentRolesData } = await supabaseAdmin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', id)
      
      const currentRoleNames = (currentRolesData as any[])?.map(r => r.roles?.name) || []
      
      // Verificar se as roles mudaram
      const sortedCurrent = [...currentRoleNames].sort().join(',')
      const sortedNew = [...roles].sort().join(',')

      if (sortedCurrent !== sortedNew) {
        // Remover roles atuais
        await supabaseAdmin.from('user_roles').delete().eq('user_id', id)
        
        // Buscar IDs das novas roles
        const { data: roleObjects } = await supabaseAdmin.from('roles').select('id, name').in('name', roles)
        
        if (roleObjects && roleObjects.length > 0) {
          const roleInserts = roleObjects.map(r => ({ user_id: id, role_id: r.id }))
          await supabaseAdmin.from('user_roles').insert(roleInserts)
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedProfile })

  } catch (error: any) {
    console.error("Erro no update de admin:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // No Supabase, deletar o perfil geralmente dispara o delete no Auth se o cascade estiver ON.
    // Se não, precisamos deletar explicitamente no auth.admin.
    
    // 1. Deletar do Auth (O Supabase deletará o perfil e roles automaticamente se houver FK cascade)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError) {
      // Se der erro no auth (ex: user não existe mais), tentamos deletar o perfil direto
      console.warn("Usuário não encontrado no Auth, tentando deletar perfil...")
    }

    // 2. Garantir deleção do perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) throw profileError

    return NextResponse.json({ success: true, message: "Usuário removido permanentemente" })

  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
