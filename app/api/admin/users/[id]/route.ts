
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"

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

/**
 * Profile fields an admin may edit from the user modal. Verification columns
 * (`verified`, `verification_status`, `verification_notes`, `is_pending_mentor`)
 * are deliberately NOT here: they only change through POST /api/admin/verify,
 * which also assigns the mentor role and notifies the person. Unknown keys
 * are stripped.
 */
const updatesSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  bio: z.string().max(5000).optional(),
  avatar_url: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
  institution: z.string().max(200).optional(),
  course: z.string().max(200).optional(),
  academic_level: z.string().max(100).optional(),
  expected_graduation: z.string().max(50).optional()
})

const patchBodySchema = z.object({
  updates: updatesSchema.default({}),
  roles: z.array(z.enum(["mentee", "mentor", "admin", "moderator"])).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const parsed = patchBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    const { updates, roles } = parsed.data

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
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    if (id === guard.admin.userId) {
      return NextResponse.json(
        { error: "Você não pode remover a própria conta de administrador" },
        { status: 400 }
      )
    }

    const result = await deleteUserCompletely(id, { source: "admin" })

    return NextResponse.json({
      success: true,
      message: "Usuário removido permanentemente",
      filesRemoved: result.filesRemoved
    })

  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
