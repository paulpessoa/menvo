import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { migrationId, action, notes } = await request.json()
    
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

    // Buscar dados da migração
    const { data: migration, error: migrationError } = await supabase
      .from('user_migrations')
      .select('*')
      .eq('id', migrationId)
      .single()

    if (migrationError || !migration) {
      return NextResponse.json({ error: 'Migração não encontrada' }, { status: 404 })
    }

    if (migration.migration_status !== 'conflict') {
      return NextResponse.json({ error: 'Migração não está em conflito' }, { status: 400 })
    }

    let updateData: any = {
      migration_notes: notes || 'Conflito resolvido manualmente'
    }

    if (action === 'merge') {
      // Tentar mesclar dados com usuário existente
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', migration.email)
        .single()

      if (existingUser) {
        // Mesclar dados relevantes do usuário antigo
        const oldData = migration.old_user_data
        const mergeUpdates: any = {}

        // Mesclar campos que estão vazios no perfil atual
        if (!existingUser.first_name && oldData.first_name) {
          mergeUpdates.first_name = oldData.first_name
        }
        if (!existingUser.last_name && oldData.last_name) {
          mergeUpdates.last_name = oldData.last_name
        }
        if (!existingUser.bio && oldData.profile_data?.bio) {
          mergeUpdates.bio = oldData.profile_data.bio
        }
        if ((!existingUser.expertise_areas || existingUser.expertise_areas.length === 0) && 
            (oldData.profile_data?.expertise || oldData.profile_data?.interests)) {
          mergeUpdates.expertise_areas = oldData.profile_data.expertise || oldData.profile_data.interests
        }

        // Aplicar atualizações se houver
        if (Object.keys(mergeUpdates).length > 0) {
          await supabase
            .from('profiles')
            .update(mergeUpdates)
            .eq('id', existingUser.id)
        }

        updateData.migration_status = 'completed'
        updateData.new_user_id = existingUser.id
        updateData.migrated_at = new Date().toISOString()
        updateData.migration_notes = `${notes || ''} - Dados mesclados com usuário existente`.trim()
      } else {
        return NextResponse.json({ error: 'Usuário existente não encontrado para mesclagem' }, { status: 400 })
      }
    } else if (action === 'skip') {
      // Marcar como falha com nota explicativa
      updateData.migration_status = 'failed'
      updateData.migration_notes = `${notes || ''} - Migração pulada manualmente devido a conflito`.trim()
    }

    // Atualizar registro de migração
    const { error: updateError } = await supabase
      .from('user_migrations')
      .update(updateData)
      .eq('id', migrationId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Conflito resolvido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao resolver conflito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
