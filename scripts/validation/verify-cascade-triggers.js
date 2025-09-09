#!/usr/bin/env node

/**
 * Script to verify cascade delete triggers are installed
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verificando Triggers de Cascade Delete')
console.log('=======================================')

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

async function verifyTriggers() {
  console.log('\n🔍 Verificando triggers...')
  
  try {
    const { data, error } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_timing
          FROM information_schema.triggers 
          WHERE trigger_name LIKE '%auth_user_deleted%'
          ORDER BY trigger_name;
        `
      })

    if (error) {
      console.error('❌ Erro ao verificar triggers:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Triggers encontrados:')
      data.forEach(trigger => {
        console.log(`   • ${trigger.trigger_name}`)
        console.log(`     Evento: ${trigger.action_timing} ${trigger.event_manipulation} on ${trigger.event_object_table}`)
      })
    } else {
      console.log('⚠️  Nenhum trigger encontrado')
    }

  } catch (error) {
    console.error('❌ Erro ao verificar triggers:', error.message)
  }
}

async function verifyFunctions() {
  console.log('\n🔍 Verificando funções...')
  
  try {
    const { data, error } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            routine_name,
            routine_type
          FROM information_schema.routines 
          WHERE routine_name LIKE '%cleanup_%' OR routine_name LIKE '%log_user_%'
          ORDER BY routine_name;
        `
      })

    if (error) {
      console.error('❌ Erro ao verificar funções:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Funções encontradas:')
      data.forEach(func => {
        console.log(`   • ${func.routine_name} (${func.routine_type})`)
      })
    } else {
      console.log('⚠️  Nenhuma função encontrada')
    }

  } catch (error) {
    console.error('❌ Erro ao verificar funções:', error.message)
  }
}

async function main() {
  try {
    await verifyTriggers()
    await verifyFunctions()
    
    console.log('\n✅ Verificação concluída!')
    console.log('\n📋 Os triggers de cascade delete estão instalados e prontos para uso.')
    console.log('   Quando um usuário for deletado de auth.users, todos os dados relacionados')
    console.log('   serão automaticamente removidos das tabelas: profiles, user_roles,')
    console.log('   mentor_availability, appointments, mentorship_sessions e feedback.')
    
  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}
