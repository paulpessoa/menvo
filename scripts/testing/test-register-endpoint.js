#!/usr/bin/env node

/**
 * Test the register endpoint to identify the "invalid API" issue
 */

console.log('🧪 Testando Endpoint de Registro')
console.log('================================')

async function testRegisterEndpoint() {
  const testData = {
    email: `test-${Date.now()}@example.com`,
    password: 'test123456',
    firstName: 'Test',
    lastName: 'User',
    userType: 'mentee'
  }

  console.log('\n📋 Dados de teste:')
  console.log('==================')
  console.log('Email:', testData.email)
  console.log('Password: [HIDDEN]')
  console.log('First Name:', testData.firstName)
  console.log('Last Name:', testData.lastName)
  console.log('User Type:', testData.userType)

  try {
    console.log('\n🔄 Enviando requisição para /api/auth/register...')
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    console.log('\n📊 Resposta do servidor:')
    console.log('========================')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    const responseData = await response.text()
    console.log('\n📄 Corpo da resposta:')
    console.log('=====================')
    console.log(responseData)

    if (response.ok) {
      console.log('\n✅ Endpoint funcionando corretamente!')
      try {
        const jsonData = JSON.parse(responseData)
        console.log('📋 Dados estruturados:', jsonData)
      } catch (e) {
        console.log('⚠️  Resposta não é JSON válido')
      }
    } else {
      console.log('\n❌ Endpoint retornou erro!')
      console.log('Status:', response.status)
      console.log('Resposta:', responseData)
      
      if (responseData.includes('invalid') || responseData.includes('Invalid')) {
        console.log('\n🔍 Possível causa do erro "invalid API":')
        console.log('• Verificar se o servidor está rodando')
        console.log('• Verificar configuração do Supabase')
        console.log('• Verificar variáveis de ambiente')
        console.log('• Verificar se há rate limiting')
      }
    }

  } catch (error) {
    console.log('\n❌ Erro ao testar endpoint:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔍 Servidor não está rodando!')
      console.log('Execute: npm run dev')
    } else if (error.message.includes('fetch')) {
      console.log('\n🔍 Problema de rede ou URL incorreta')
      console.log('Verifique se o servidor está rodando na porta 3000')
    }
  }
}

console.log('\n⚠️  NOTA: Este teste requer que o servidor Next.js esteja rodando')
console.log('Execute "npm run dev" em outro terminal antes de executar este teste')

// Wait a bit and then run the test
setTimeout(testRegisterEndpoint, 1000)
