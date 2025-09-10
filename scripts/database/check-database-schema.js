#!/usr/bin/env node

/**
 * Script to check database schema and table structures
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verificando Schema do Banco de Dados')
console.log('======================================')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTableStructure(tableName) {
  console.log(`\n📋 Estrutura da tabela: ${tableName}`)
  console.log('=' + '='.repeat(tableName.length + 20))
  
  try {
    // Get a sample record to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.error(`❌ Erro ao acessar tabela ${tableName}:`, error.message)
      return null
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      console.log(`✅ Colunas encontradas (${columns.length}):`)
      columns.forEach(col => {
        const value = data[0][col]
        const type = typeof value
        console.log(`   • ${col} (${type})`)
      })
    } else {
      console.log('⚠️  Tabela vazia, não é possível determinar estrutura')
    }
    
    return data
    
  } catch (error) {
    console.error(`❌ Erro ao verificar tabela ${tableName}:`, error.message)
    return null
  }
}

async function checkRolesTable() {
  console.log(`\n📋 Verificando tabela de roles`)
  console.log('=============================')
  
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
    
    if (error) {
      console.error(`❌ Erro ao acessar tabela roles:`, error.message)
      return
    }
    
    console.log(`✅ Roles disponíveis (${data?.length || 0}):`)
    data?.forEach(role => {
      console.log(`   • ${role.name} (ID: ${role.id})`)
    })
    
  } catch (error) {
    console.error(`❌ Erro ao verificar roles:`, error.message)
  }
}

async function checkUserRolesTable() {
  console.log(`\n📋 Verificando tabela user_roles`)
  console.log('===============================')
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_id,
        roles (
          name
        )
      `)
      .limit(5)
    
    if (error) {
      console.error(`❌ Erro ao acessar tabela user_roles:`, error.message)
      return
    }
    
    console.log(`✅ Exemplos de user_roles (${data?.length || 0}):`)
    data?.forEach(userRole => {
      console.log(`   • User: ${userRole.user_id} → Role: ${userRole.roles?.name || 'N/A'}`)
    })
    
  } catch (error) {
    console.error(`❌ Erro ao verificar user_roles:`, error.message)
  }
}

async function checkSpecificUsers() {
  console.log(`\n👥 Verificando usuários específicos`)
  console.log('==================================')
  
  const userIds = [
    'b64b6a94-6a52-47c4-944f-960d1dc9f570',
    '7be27332-e84e-47eb-8a11-c3b315cec0a6'
  ]
  
  for (const userId of userIds) {
    console.log(`\n🔍 Usuário: ${userId}`)
    
    try {
      // Check auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      
      if (authError || !authUser.user) {
        console.log(`❌ Não encontrado no auth: ${authError?.message || 'User not found'}`)
        continue
      }
      
      console.log(`✅ Auth: ${authUser.user.email}`)
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.log(`❌ Profile: ${profileError.message}`)
      } else {
        console.log(`✅ Profile: ${profile?.full_name || profile?.first_name || 'Nome não definido'}`)
      }
      
      // Check role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`roles (name)`)
        .eq('user_id', userId)
        .single()
      
      if (roleError) {
        console.log(`❌ Role: ${roleError.message}`)
      } else {
        console.log(`✅ Role: ${roleData?.roles?.name || 'Nenhuma'}`)
      }
      
    } catch (error) {
      console.error(`❌ Erro ao verificar usuário ${userId}:`, error.message)
    }
  }
}

async function main() {
  try {
    // Check main tables
    await checkTableStructure('profiles')
    await checkTableStructure('user_roles')
    await checkRolesTable()
    await checkUserRolesTable()
    
    // Check if mentor_availability table exists
    await checkTableStructure('mentor_availability')
    
    // Check specific users
    await checkSpecificUsers()
    
    console.log('\n🎯 Resumo da Verificação:')
    console.log('========================')
    console.log('✅ Schema verificado')
    console.log('✅ Estruturas de tabelas analisadas')
    console.log('✅ Usuários específicos verificados')
    
    console.log('\n📋 Próximos passos:')
    console.log('1. Ajustar script de configuração baseado na estrutura real')
    console.log('2. Usar apenas colunas que existem nas tabelas')
    console.log('3. Executar configuração novamente')
    
  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}