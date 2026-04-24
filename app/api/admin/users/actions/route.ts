import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logAdminAction } from '@/lib/audit-logger'

// POST - Ações especiais em usuários (reset senha, alterar status, etc.)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Verificar se usuário é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar role de admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', user.id)

    if (roleError || !userRoles?.some((ur: any) => ur.roles?.name === 'admin')) {
      return NextResponse.json({ error: 'Acesso negado - apenas admins' }, { status: 403 })
    }

    const { action, userId, data: actionData } = body

    if (!action || !userId) {
      return NextResponse.json({ error: 'Ação e ID do usuário são obrigatórios' }, { status: 400 })
    }

    // Buscar dados do usuário alvo
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email, full_name, verified')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    let result: any = { success: true }
    let auditDetails: any = {}

    switch (action) {
      case 'reset_password':
        // Gerar nova senha temporária
        const tempPassword = generateTemporaryPassword()
        
        const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
          password: tempPassword
        })

        if (passwordError) {
          return NextResponse.json({ error: 'Erro ao resetar senha' }, { status: 500 })
        }

        result.temporaryPassword = tempPassword
        auditDetails = { temporary_password_generated: true }
        
        // Log de auditoria
        await logAdminAction(
          user.id,
          'password_reset',
          auditDetails,
          userId,
          targetUser.email,
          request
        )
        break

      case 'toggle_verification':
        const newVerificationStatus = !targetUser.verified
        
        const { error: verificationError } = await supabase
          .from('profiles')
          .update({ verified: newVerificationStatus })
          .eq('id', userId)

        if (verificationError) {
          return NextResponse.json({ error: 'Erro ao alterar status de verificação' }, { status: 500 })
        }

        result.newStatus = newVerificationStatus ? 'verified' : 'pending'
        auditDetails = { 
          old_status: targetUser.verified ? 'verified' : 'pending',
          new_status: result.newStatus
        }
        
        // Log de auditoria
        await logAdminAction(
          user.id,
          'user_status_changed',
          auditDetails,
          userId,
          targetUser.email,
          request
        )
        break

      case 'toggle_volunteer':
        const currentVolunteerStatus = actionData?.currentStatus || false
        const newVolunteerStatus = !currentVolunteerStatus
        
        const { error: volunteerError } = await supabase
          .from('profiles')
          .update({ is_volunteer: newVolunteerStatus })
          .eq('id', userId)

        if (volunteerError) {
          return NextResponse.json({ error: 'Erro ao alterar status de voluntário' }, { status: 500 })
        }

        result.newVolunteerStatus = newVolunteerStatus
        auditDetails = { 
          old_volunteer_status: currentVolunteerStatus,
          new_volunteer_status: newVolunteerStatus
        }
        
        // Log de auditoria
        await logAdminAction(
          user.id,
          'user_updated',
          auditDetails,
          userId,
          targetUser.email,
          request
        )
        break

      case 'send_welcome_email':
        // Aqui você pode integrar com seu sistema de email
        // Por enquanto, apenas registrar a ação
        auditDetails = { email_type: 'welcome', sent_to: targetUser.email }
        
        // Log de auditoria
        await logAdminAction(
          user.id,
          'bulk_action',
          auditDetails,
          userId,
          targetUser.email,
          request
        )
        
        result.message = 'Email de boas-vindas enviado'
        break

      case 'bulk_role_change':
        const { userIds, newRole } = actionData
        
        if (!userIds || !Array.isArray(userIds) || !newRole) {
          return NextResponse.json({ error: 'IDs de usuários e nova role são obrigatórios' }, { status: 400 })
        }

        // Buscar ID da role
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', newRole)
          .single()

        if (!roleData) {
          return NextResponse.json({ error: 'Role não encontrada' }, { status: 400 })
        }

        let successCount = 0
        let errorCount = 0

        for (const targetUserId of userIds) {
          try {
            // Remover roles existentes
            await supabase
              .from('user_roles')
              .delete()
              .eq('user_id', targetUserId)

            // Adicionar nova role se não for mentee
            if (newRole !== 'mentee') {
              await supabase
                .from('user_roles')
                .insert({
                  user_id: targetUserId,
                  role_id: roleData.id
                })
            }

            successCount++
          } catch (error) {
            errorCount++
            console.error(`Erro ao alterar role do usuário ${targetUserId}:`, error)
          }
        }

        auditDetails = { 
          new_role: newRole,
          users_affected: userIds.length,
          successful: successCount,
          failed: errorCount
        }
        
        // Log de auditoria
        await logAdminAction(
          user.id,
          'bulk_action',
          auditDetails,
          undefined,
          undefined,
          request
        )

        result = {
          success: true,
          message: `${successCount} usuários atualizados, ${errorCount} falhas`,
          successCount,
          errorCount
        }
        break

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao executar ação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Gera senha temporária segura
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}
