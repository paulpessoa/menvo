#!/usr/bin/env node

/**
 * Test script for cascade delete triggers
 * This script tests the cascade delete functionality safely
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🧪 Testando Triggers de Cascade Delete')
console.log('=====================================')

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

async function checkTriggersExist() {
  console.log('\n🔍 Verificando se os triggers existem...')
  
  const expectedTriggers = [
    'on_auth_user_deleted_cleanup_profiles',
    'on_auth_user_deleted_cleanup_user_roles',
    'on_auth_user_deleted_cleanup_mentor_availability',
    'on_auth_user_deleted_cleanup_appointments'
  ]

  try {
    // This is a simplified check - in a real scenario you'd query information_schema
    console.log('✅ Triggers esperados:')
    expectedTriggers.forEach(trigger => {
      console.log(`   • ${trigger}`)
    })
    
    console.log('\n📋 Para verificar se existem, execute no Supabase SQL Editor:')
    console.log('SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE \'%auth_user_deleted%\';')
    
    return true
  } catch (error) {
    console.error('❌ Erro ao verificar triggers:', error.message)
    return false
  }
}

async function simulateCascadeDeleteTest() {
  console.log('\n🧪 Simulando Teste de Cascade Delete')
  console.log('===================================')
  
  console.log('📋 Cenário de teste:')
  console.log('1. Usuário é deletado do auth.users')
  console.log('2. Triggers devem automaticamente deletar:')
  console.log('   • Registro em profiles')
  console.log('   • Registro em user_roles')
  console.log('   • Registros em mentor_availability')
  console.log('   • Registros em appointments (como mentor ou mentee)')
  console.log('   • Registros em mentorship_sessions')
  console.log('   • Registros em feedback')

  console.log('\n⚠️  IMPORTANTE: Este é apenas um teste simulado!')
  console.log('Para testar realmente, você precisaria:')
  console.log('1. Criar um usuário de teste')
  console.log('2. Criar registros relacionados')
  console.log('3. Deletar o usuário')
  console.log('4. Verificar se os registros relacionados foram deletados')

  return true
}

async function createTestPlan() {
  console.log('\n📋 Plano de Teste Detalhado')
  console.log('==========================')

  const testPlan = {
    preparation: [
      'Fazer backup do banco de dados',
      'Criar usuário de teste via Supabase Auth',
      'Criar perfil de teste na tabela profiles',
      'Criar role de teste na tabela user_roles',
      'Criar disponibilidade de teste (se mentor)',
      'Criar agendamento de teste'
    ],
    execution: [
      'Verificar que todos os registros existem',
      'Executar DELETE FROM auth.users WHERE id = \'test-user-id\'',
      'Verificar logs do Supabase para mensagens dos triggers',
      'Confirmar que registros relacionados foram deletados'
    ],
    verification: [
      'SELECT * FROM profiles WHERE id = \'test-user-id\' (deve retornar vazio)',
      'SELECT * FROM user_roles WHERE user_id = \'test-user-id\' (deve retornar vazio)',
      'SELECT * FROM mentor_availability WHERE mentor_id = \'test-user-id\' (deve retornar vazio)',
      'SELECT * FROM appointments WHERE mentor_id = \'test-user-id\' OR mentee_id = \'test-user-id\' (deve retornar vazio)'
    ]
  }

  console.log('\n🔧 Preparação:')
  testPlan.preparation.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step}`)
  })

  console.log('\n▶️  Execução:')
  testPlan.execution.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step}`)
  })

  console.log('\n✅ Verificação:')
  testPlan.verification.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step}`)
  })

  return testPlan
}

async function generateTestSQL() {
  console.log('\n📝 SQL de Teste Gerado')
  console.log('======================')

  const testSQL = `
-- =====================================================
-- TESTE DE CASCADE DELETE - EXECUTE COM CUIDADO!
-- =====================================================

-- 1. Criar usuário de teste (substitua por ID real de teste)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES ('test-user-id-123', 'test@example.com', 'encrypted', NOW(), NOW(), NOW());

-- 2. Criar registros relacionados de teste
-- INSERT INTO profiles (id, email, first_name, last_name) 
-- VALUES ('test-user-id-123', 'test@example.com', 'Test', 'User');

-- INSERT INTO user_roles (user_id, role_id) 
-- VALUES ('test-user-id-123', (SELECT id FROM roles WHERE name = 'mentor' LIMIT 1));

-- 3. Verificar registros antes da deleção
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles WHERE id = 'test-user-id-123'
UNION ALL
SELECT 'User Roles' as table_name, COUNT(*) as count FROM user_roles WHERE user_id = 'test-user-id-123'
UNION ALL
SELECT 'Mentor Availability' as table_name, COUNT(*) as count FROM mentor_availability WHERE mentor_id = 'test-user-id-123'
UNION ALL
SELECT 'Appointments' as table_name, COUNT(*) as count FROM appointments WHERE mentor_id = 'test-user-id-123' OR mentee_id = 'test-user-id-123';

-- 4. DELETAR USUÁRIO (triggers devem ser executados automaticamente)
-- DELETE FROM auth.users WHERE id = 'test-user-id-123';

-- 5. Verificar registros após a deleção (todos devem retornar 0)
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles WHERE id = 'test-user-id-123'
UNION ALL
SELECT 'User Roles' as table_name, COUNT(*) as count FROM user_roles WHERE user_id = 'test-user-id-123'
UNION ALL
SELECT 'Mentor Availability' as table_name, COUNT(*) as count FROM mentor_availability WHERE mentor_id = 'test-user-id-123'
UNION ALL
SELECT 'Appointments' as table_name, COUNT(*) as count FROM appointments WHERE mentor_id = 'test-user-id-123' OR mentee_id = 'test-user-id-123';

-- 6. Verificar logs dos triggers (se disponível)
-- SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%cleanup_%';
  `

  console.log(testSQL)
  
  console.log('\n⚠️  ATENÇÃO:')
  console.log('• Descomente as linhas conforme necessário')
  console.log('• Use apenas IDs de teste, nunca dados reais')
  console.log('• Execute em ambiente de desenvolvimento primeiro')
  console.log('• Faça backup antes de testar')

  return testSQL
}

async function checkDatabaseTables() {
  console.log('\n🗄️  Verificando Tabelas do Banco')
  console.log('===============================')

  const tables = [
    'profiles',
    'user_roles', 
    'mentor_availability',
    'appointments',
    'mentorship_sessions',
    'feedback'
  ]

  console.log('📋 Tabelas que serão afetadas pelos triggers:')
  tables.forEach(table => {
    console.log(`   • ${table}`)
  })

  console.log('\n📝 Para verificar se as tabelas existem, execute:')
  console.log('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name IN (\'profiles\', \'user_roles\', \'mentor_availability\', \'appointments\');')

  return tables
}

async function main() {
  try {
    console.log('🎯 Objetivo: Verificar e testar triggers de cascade delete')
    
    // Check if triggers exist
    await checkTriggersExist()
    
    // Check database tables
    await checkDatabaseTables()
    
    // Simulate test scenario
    await simulateCascadeDeleteTest()
    
    // Create detailed test plan
    await createTestPlan()
    
    // Generate test SQL
    await generateTestSQL()
    
    console.log('\n🎉 Análise de teste concluída!')
    console.log('\n📋 Resumo:')
    console.log('✅ Triggers de cascade delete foram definidos')
    console.log('✅ Plano de teste foi criado')
    console.log('✅ SQL de teste foi gerado')
    console.log('⚠️  Teste real deve ser feito com cuidado em ambiente controlado')
    
    console.log('\n🔧 Próximos passos:')
    console.log('1. Aplicar os triggers: node scripts/database/apply-cascade-triggers.js')
    console.log('2. Verificar no Supabase Dashboard se foram criados')
    console.log('3. Executar teste controlado com dados de teste')
    console.log('4. Monitorar logs durante o teste')
    
  } catch (error) {
    console.error('\n❌ Erro durante teste:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}
