#!/usr/bin/env tsx

/**
 * Script de Migração de Usuários da Plataforma Antiga
 * 
 * Este script identifica usuários da plataforma antiga e os migra
 * para a nova estrutura, resolvendo conflitos quando necessário.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface OldUserData {
  id: string
  email: string
  name?: string
  first_name?: string
  last_name?: string
  role?: string
  created_at?: string
  profile_data?: any
  // Adicione outros campos conforme necessário
}

interface MigrationResult {
  total: number
  successful: number
  failed: number
  conflicts: number
  errors: string[]
}

/**
 * Carrega dados de usuários da plataforma antiga
 * Substitua esta função pela lógica específica da sua fonte de dados
 */
async function loadOldUserData(): Promise<OldUserData[]> {
  // EXEMPLO: Carregando de um arquivo JSON
  // Na prática, isso pode vir de uma API, banco de dados antigo, etc.
  
  const dataPath = path.join(process.cwd(), 'data', 'old-users.json')
  
  if (!fs.existsSync(dataPath)) {
    console.log('📁 Arquivo de dados antigos não encontrado em:', dataPath)
    console.log('💡 Criando arquivo de exemplo...')
    
    // Criar diretório se não existir
    const dataDir = path.dirname(dataPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Criar arquivo de exemplo
    const exampleData: OldUserData[] = [
      {
        id: 'old_user_1',
        email: 'mentor1@example.com',
        first_name: 'João',
        last_name: 'Silva',
        role: 'mentor',
        created_at: '2024-01-01T00:00:00Z',
        profile_data: {
          bio: 'Mentor experiente em tecnologia',
          expertise: ['JavaScript', 'React', 'Node.js']
        }
      },
      {
        id: 'old_user_2', 
        email: 'mentee1@example.com',
        first_name: 'Maria',
        last_name: 'Santos',
        role: 'mentee',
        created_at: '2024-01-15T00:00:00Z',
        profile_data: {
          bio: 'Estudante de programação',
          interests: ['Web Development', 'Mobile Apps']
        }
      }
    ]
    
    fs.writeFileSync(dataPath, JSON.stringify(exampleData, null, 2))
    console.log('✅ Arquivo de exemplo criado. Edite-o com seus dados reais e execute novamente.')
    return []
  }
  
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(fileContent) as OldUserData[]
    console.log(`📊 Carregados ${data.length} usuários da plataforma antiga`)
    return data
  } catch (error) {
    console.error('❌ Erro ao carregar dados antigos:', error)
    return []
  }
}

/**
 * Verifica se um usuário já existe na nova plataforma
 */
async function checkExistingUser(email: string): Promise<{ exists: boolean; userId?: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Erro ao verificar usuário existente:', error)
    return { exists: false }
  }
  
  return {
    exists: !!data,
    userId: data?.id
  }
}

/**
 * Mapeia role da plataforma antiga para a nova
 */
function mapUserRole(oldRole?: string): string {
  const roleMap: Record<string, string> = {
    'mentor': 'mentor',
    'mentee': 'mentee', 
    'mentorado': 'mentee',
    'admin': 'admin',
    'administrator': 'admin'
  }
  
  return roleMap[oldRole?.toLowerCase() || ''] || 'mentee'
}

/**
 * Cria registro de migração no banco
 */
async function createMigrationRecord(oldUser: OldUserData, status: string = 'pending', conflictReason?: string) {
  const { data, error } = await supabase
    .from('user_migrations')
    .insert({
      old_user_id: oldUser.id,
      email: oldUser.email,
      old_user_data: oldUser,
      migration_status: status,
      conflict_reason: conflictReason
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ Erro ao criar registro de migração:', error)
    return null
  }
  
  return data
}

/**
 * Migra um usuário individual
 */
async function migrateUser(oldUser: OldUserData): Promise<{ success: boolean; error?: string; conflict?: boolean }> {
  try {
    // Verificar se usuário já existe
    const existing = await checkExistingUser(oldUser.email)
    
    if (existing.exists) {
      // Usuário já existe - criar registro de conflito
      await createMigrationRecord(oldUser, 'conflict', 'Email já existe na nova plataforma')
      console.log(`⚠️  Conflito: ${oldUser.email} já existe`)
      return { success: false, conflict: true, error: 'Email já existe' }
    }
    
    // Verificar se já existe registro de migração
    const { data: existingMigration } = await supabase
      .from('user_migrations')
      .select('id, migration_status')
      .eq('email', oldUser.email)
      .single()
    
    if (existingMigration) {
      console.log(`ℹ️  Migração já existe para ${oldUser.email}: ${existingMigration.migration_status}`)
      return { success: existingMigration.migration_status === 'completed' }
    }
    
    // Criar registro de migração
    const migrationRecord = await createMigrationRecord(oldUser)
    if (!migrationRecord) {
      return { success: false, error: 'Falha ao criar registro de migração' }
    }
    
    // Criar usuário na nova plataforma via Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: oldUser.email,
      password: generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        first_name: oldUser.first_name,
        last_name: oldUser.last_name,
        migrated_from_old_platform: true,
        old_user_id: oldUser.id
      }
    })
    
    if (authError) {
      // Atualizar status para failed
      await supabase
        .from('user_migrations')
        .update({ 
          migration_status: 'failed',
          migration_notes: `Erro ao criar usuário: ${authError.message}`
        })
        .eq('id', migrationRecord.id)
      
      return { success: false, error: authError.message }
    }
    
    // Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: oldUser.email,
        first_name: oldUser.first_name,
        last_name: oldUser.last_name,
        bio: oldUser.profile_data?.bio,
        expertise_areas: oldUser.profile_data?.expertise || oldUser.profile_data?.interests
      })
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError)
      // Tentar deletar usuário criado
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      await supabase
        .from('user_migrations')
        .update({ 
          migration_status: 'failed',
          migration_notes: `Erro ao criar perfil: ${profileError.message}`
        })
        .eq('id', migrationRecord.id)
      
      return { success: false, error: profileError.message }
    }
    
    // Atribuir role ao usuário
    const mappedRole = mapUserRole(oldUser.role)
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', mappedRole)
      .single()
    
    if (roleData) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role_id: roleData.id
        })
    }
    
    // Atualizar registro de migração como completo
    await supabase
      .from('user_migrations')
      .update({ 
        migration_status: 'completed',
        new_user_id: authUser.user.id,
        migrated_at: new Date().toISOString(),
        migration_notes: `Migração concluída com sucesso. Role: ${mappedRole}`
      })
      .eq('id', migrationRecord.id)
    
    console.log(`✅ Usuário migrado: ${oldUser.email} -> ${authUser.user.id}`)
    return { success: true }
    
  } catch (error) {
    console.error('❌ Erro inesperado na migração:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

/**
 * Gera senha temporária para usuários migrados
 */
function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
}

/**
 * Executa migração em lotes
 */
async function runMigration(batchSize: number = 10): Promise<MigrationResult> {
  console.log('🚀 Iniciando migração de usuários...')
  
  const oldUsers = await loadOldUserData()
  if (oldUsers.length === 0) {
    console.log('ℹ️  Nenhum usuário para migrar')
    return { total: 0, successful: 0, failed: 0, conflicts: 0, errors: [] }
  }
  
  const result: MigrationResult = {
    total: oldUsers.length,
    successful: 0,
    failed: 0,
    conflicts: 0,
    errors: []
  }
  
  // Processar em lotes
  for (let i = 0; i < oldUsers.length; i += batchSize) {
    const batch = oldUsers.slice(i, i + batchSize)
    console.log(`📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(oldUsers.length / batchSize)}`)
    
    const promises = batch.map(user => migrateUser(user))
    const results = await Promise.all(promises)
    
    results.forEach((res, index) => {
      if (res.success) {
        result.successful++
      } else if (res.conflict) {
        result.conflicts++
      } else {
        result.failed++
        if (res.error) {
          result.errors.push(`${batch[index].email}: ${res.error}`)
        }
      }
    })
    
    // Pausa entre lotes para não sobrecarregar
    if (i + batchSize < oldUsers.length) {
      console.log('⏳ Aguardando 2 segundos antes do próximo lote...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return result
}

/**
 * Função principal
 */
async function main() {
  try {
    const result = await runMigration()
    
    console.log('\n📊 RESULTADO DA MIGRAÇÃO:')
    console.log(`Total de usuários: ${result.total}`)
    console.log(`✅ Migrados com sucesso: ${result.successful}`)
    console.log(`⚠️  Conflitos: ${result.conflicts}`)
    console.log(`❌ Falhas: ${result.failed}`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ ERROS:')
      result.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (result.conflicts > 0) {
      console.log('\n💡 Para resolver conflitos, acesse o painel administrativo em /admin/users/migrations')
    }
    
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

export { runMigration, migrateUser, loadOldUserData }