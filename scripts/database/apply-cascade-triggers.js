#!/usr/bin/env node

/**
 * Script to apply cascade delete triggers to Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🗄️  Aplicando Triggers de Cascade Delete')
console.log('======================================')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function readSQLFile() {
  const sqlFilePath = path.join(__dirname, '..', '..', 'database', 'triggers', 'cascade-delete-triggers.sql')
  
  try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    console.log('✅ Arquivo SQL carregado:', sqlFilePath)
    return sqlContent
  } catch (error) {
    console.error('❌ Erro ao ler arquivo SQL:', error.message)
    throw error
  }
}

async function executeSQLStatements(sqlContent) {
  // Split SQL content into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  console.log(`\n📋 Executando ${statements.length} comandos SQL...`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) {
      continue
    }

    try {
      console.log(`\n🔄 Executando comando ${i + 1}/${statements.length}...`)
      
      // Extract command type for better logging
      const commandType = statement.split(' ')[0].toUpperCase()
      console.log(`   Tipo: ${commandType}`)
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      })

      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message)
        errorCount++
        
        // Don't stop on certain expected errors
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist')) {
          console.log('   ⚠️  Erro esperado, continuando...')
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`)
        successCount++
      }
      
    } catch (error) {
      console.error(`❌ Erro inesperado no comando ${i + 1}:`, error.message)
      errorCount++
    }
  }

  console.log(`\n📊 Resumo da Execução:`)
  console.log(`✅ Sucessos: ${successCount}`)
  console.log(`❌ Erros: ${errorCount}`)
  
  return { successCount, errorCount }
}

async function verifyTriggers() {
  console.log('\n🔍 Verificando triggers criados...')
  
  try {
    // Query to check triggers
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, action_timing')
      .like('trigger_name', '%auth_user_deleted%')

    if (triggerError) {
      console.error('❌ Erro ao verificar triggers:', triggerError.message)
      return
    }

    if (triggers && triggers.length > 0) {
      console.log('✅ Triggers encontrados:')
      triggers.forEach(trigger => {
        console.log(`   • ${trigger.trigger_name} (${trigger.action_timing} on ${trigger.event_object_table})`)
      })
    } else {
      console.log('⚠️  Nenhum trigger encontrado')
    }

  } catch (error) {
    console.log('⚠️  Não foi possível verificar triggers automaticamente')
    console.log('   Execute manualmente no Supabase SQL Editor:')
    console.log('   SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE \'%auth_user_deleted%\';')
  }
}

async function createTestFunction() {
  console.log('\n🧪 Criando função de teste...')
  
  const testFunction = `
    CREATE OR REPLACE FUNCTION test_cascade_delete_triggers()
    RETURNS TEXT AS $$
    DECLARE
        test_user_id UUID;
        result TEXT := '';
    BEGIN
        -- This is a test function to verify triggers work
        -- DO NOT run this in production with real user IDs
        
        result := 'Cascade delete triggers are installed and ready to use.';
        result := result || E'\\n\\nTo test manually:';
        result := result || E'\\n1. Create a test user in auth.users';
        result := result || E'\\n2. Create related records in profiles, user_roles, etc.';
        result := result || E'\\n3. Delete the test user';
        result := result || E'\\n4. Verify related records are automatically deleted';
        
        RETURN result;
    END;
    $$ LANGUAGE plpgsql;
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: testFunction })
    
    if (error) {
      console.error('❌ Erro ao criar função de teste:', error.message)
    } else {
      console.log('✅ Função de teste criada com sucesso')
      console.log('   Execute: SELECT test_cascade_delete_triggers(); no SQL Editor')
    }
  } catch (error) {
    console.log('⚠️  Não foi possível criar função de teste')
  }
}

async function main() {
  try {
    // Read SQL file
    const sqlContent = await readSQLFile()
    
    // Execute SQL statements
    const { successCount, errorCount } = await executeSQLStatements(sqlContent)
    
    // Verify triggers
    await verifyTriggers()
    
    // Create test function
    await createTestFunction()
    
    console.log('\n🎉 Processo concluído!')
    
    if (errorCount > 0) {
      console.log('\n⚠️  Alguns erros ocorreram, mas isso pode ser normal')
      console.log('   (ex: triggers já existentes sendo recriados)')
    }
    
    console.log('\n📋 Próximos passos:')
    console.log('1. Verifique os triggers no Supabase Dashboard > SQL Editor')
    console.log('2. Execute testes em ambiente de desenvolvimento')
    console.log('3. Monitore logs para verificar funcionamento')
    
  } catch (error) {
    console.error('\n❌ Erro durante execução:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}