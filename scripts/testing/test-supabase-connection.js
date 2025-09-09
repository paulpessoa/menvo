#!/usr/bin/env node

/**
 * Test Supabase connection and environment variables
 */

const { createClient } = require('@supabase/supabase-js')

console.log('🔍 Testando Conexão com Supabase')
console.log('================================')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n📋 Verificando Variáveis de Ambiente:')
console.log('====================================')
console.log('✓ SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida')
console.log('✓ SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Definida' : '❌ Não definida')
console.log('✓ SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida')

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Variáveis de ambiente essenciais não encontradas!')
  process.exit(1)
}

async function testConnection() {
  console.log('\n🔄 Testando Conexão...')
  
  try {
    // Test with anon key
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('📡 Testando conexão com chave anônima...')
    const { data, error } = await supabaseAnon.from('profiles').select('count').limit(1)
    
    if (error) {
      console.log('❌ Erro com chave anônima:', error.message)
    } else {
      console.log('✅ Conexão com chave anônima: OK')
    }

    // Test with service key if available
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      console.log('📡 Testando conexão com service key...')
      const { data: adminData, error: adminError } = await supabaseAdmin.from('profiles').select('count').limit(1)
      
      if (adminError) {
        console.log('❌ Erro com service key:', adminError.message)
      } else {
        console.log('✅ Conexão com service key: OK')
      }

      // Test roles table
      console.log('📡 Testando tabela de roles...')
      const { data: rolesData, error: rolesError } = await supabaseAdmin.from('roles').select('*')
      
      if (rolesError) {
        console.log('❌ Erro ao acessar tabela roles:', rolesError.message)
      } else {
        console.log('✅ Tabela roles acessível:', rolesData?.length || 0, 'roles encontradas')
        if (rolesData && rolesData.length > 0) {
          console.log('   Roles disponíveis:', rolesData.map(r => r.name).join(', '))
        }
      }
    }

    console.log('\n🎉 Teste de conexão concluído!')
    
  } catch (error) {
    console.log('\n❌ Erro durante teste de conexão:', error.message)
    process.exit(1)
  }
}

async function testAuth() {
  console.log('\n🔐 Testando Funcionalidades de Auth...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test auth session
    console.log('📡 Verificando sessão atual...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message)
    } else {
      console.log('✅ Verificação de sessão: OK')
      console.log('   Usuário logado:', session.session?.user ? 'Sim' : 'Não')
    }

    console.log('\n🎉 Teste de auth concluído!')
    
  } catch (error) {
    console.log('\n❌ Erro durante teste de auth:', error.message)
  }
}

// Run tests
testConnection().then(() => testAuth())
