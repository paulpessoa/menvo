// Script para testar o fluxo completo de registro
// Execute com: node scripts/test-registration-flow.js

const API_BASE = 'http://localhost:3000';

async function testRegistration() {
  console.log('🧪 Testando fluxo de registro...\n');

  // Dados de teste
  const testUser = {
    email: 'teste.mentor@example.com',
    password: 'senha123',
    firstName: 'João',
    lastName: 'Silva',
    userType: 'mentor'
  };

  try {
    // 1. Registrar usuário
    console.log('1️⃣ Registrando usuário...');
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerResult = await registerResponse.json();
    console.log('📝 Resultado do registro:', registerResult);

    if (!registerResponse.ok) {
      console.error('❌ Erro no registro:', registerResult);
      return;
    }

    console.log('✅ Usuário registrado com sucesso!');
    console.log('📧 Email de confirmação enviado para:', testUser.email);
    
    // 2. Verificar se o perfil foi criado
    console.log('\n2️⃣ Verificando se o perfil foi criado automaticamente...');
    
    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Perfil deve ter sido criado pelo trigger!');
    console.log('📋 Para verificar, execute:');
    console.log(`   docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT * FROM public.profiles WHERE email = '${testUser.email}';"`);
    
    // 3. Explicar próximos passos
    console.log('\n3️⃣ Próximos passos para verificação de mentor:');
    console.log('📌 O mentor foi criado com verified = false');
    console.log('📌 Para aprovar o mentor, você precisa:');
    console.log('   a) Ter um usuário admin');
    console.log('   b) Usar a API /api/mentors/verify');
    console.log('   c) Ou executar SQL direto no banco');
    
    console.log('\n🎯 Comandos úteis:');
    console.log('📊 Ver todos os perfis:');
    console.log('   docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT email, first_name, last_name, verified FROM public.profiles;"');
    
    console.log('\n✅ Aprovar mentor via SQL:');
    console.log(`   docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "UPDATE public.profiles SET verified = true WHERE email = '${testUser.email}';"`);

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

// Executar teste
testRegistration();
