// Script para testar os endpoints de volunteer activities
// Execute com: npx tsx scripts/test-volunteer-endpoints.ts

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface TestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  data?: any
  error?: string
}

async function testEndpoint(
  endpoint: string, 
  method: string = 'GET', 
  body?: any,
  headers: Record<string, string> = {}
): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(body && { body: JSON.stringify(body) })
    })

    const data = await response.json()

    return {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? data.error || 'Unknown error' : undefined
    }
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

async function runTests() {
  console.log('🧪 Testando endpoints de volunteer activities...\n')

  const tests: TestResult[] = []

  // Test 1: Check tables status (admin endpoint)
  console.log('1. Verificando status das tabelas...')
  const tableCheck = await testEndpoint('/api/admin/check-tables')
  tests.push(tableCheck)
  
  if (tableCheck.success) {
    console.log('✅ Status das tabelas obtido com sucesso')
    console.log(`   - volunteer_activities existe: ${tableCheck.data?.tables?.volunteer_activities?.exists}`)
    console.log(`   - is_volunteer column existe: ${tableCheck.data?.tables?.profiles_is_volunteer_column?.exists}`)
    console.log(`   - Migração necessária: ${tableCheck.data?.migration_needed}`)
  } else {
    console.log(`❌ Erro ao verificar tabelas: ${tableCheck.error}`)
  }

  // Test 2: Get volunteer activities (should work if tables exist)
  console.log('\n2. Testando GET /api/volunteer-activities...')
  const getActivities = await testEndpoint('/api/volunteer-activities')
  tests.push(getActivities)
  
  if (getActivities.success) {
    console.log('✅ Endpoint de atividades funcionando')
    console.log(`   - Atividades encontradas: ${getActivities.data?.activities?.length || 0}`)
  } else {
    console.log(`❌ Erro ao buscar atividades: ${getActivities.error}`)
  }

  // Test 3: Get volunteer stats
  console.log('\n3. Testando GET /api/volunteer-activities/stats...')
  const getStats = await testEndpoint('/api/volunteer-activities/stats')
  tests.push(getStats)
  
  if (getStats.success) {
    console.log('✅ Endpoint de estatísticas funcionando')
    console.log(`   - Total de atividades: ${getStats.data?.total_activities || 0}`)
    console.log(`   - Total de voluntários: ${getStats.data?.total_volunteers || 0}`)
    console.log(`   - Total de horas: ${getStats.data?.total_hours || 0}`)
  } else {
    console.log(`❌ Erro ao buscar estatísticas: ${getStats.error}`)
  }

  // Test 4: Try to create a volunteer activity (will fail without auth, but tests endpoint)
  console.log('\n4. Testando POST /api/volunteer-activities (sem auth)...')
  const createActivity = await testEndpoint('/api/volunteer-activities', 'POST', {
    title: 'Teste de Mentoria',
    activity_type: 'mentoria',
    description: 'Teste de criação de atividade',
    hours: 2,
    date: '2024-01-15'
  })
  tests.push(createActivity)
  
  if (createActivity.status === 401) {
    console.log('✅ Endpoint protegido corretamente (401 Unauthorized)')
  } else if (createActivity.success) {
    console.log('✅ Atividade criada com sucesso (usuário autenticado)')
  } else {
    console.log(`❌ Erro inesperado: ${createActivity.error}`)
  }

  // Summary
  console.log('\n📊 Resumo dos testes:')
  console.log('=' .repeat(50))
  
  const successful = tests.filter(t => t.success).length
  const total = tests.length
  
  tests.forEach(test => {
    const status = test.success ? '✅' : '❌'
    console.log(`${status} ${test.method} ${test.endpoint} (${test.status})`)
    if (test.error) {
      console.log(`   Erro: ${test.error}`)
    }
  })
  
  console.log(`\n${successful}/${total} testes passaram`)
  
  if (successful === total) {
    console.log('\n🎉 Todos os testes passaram! Sistema de voluntários funcionando.')
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique as migrações e configurações.')
  }

  return tests
}

// Execute tests if this file is run directly
if (require.main === module) {
  runTests().catch(console.error)
}

export { runTests, testEndpoint }