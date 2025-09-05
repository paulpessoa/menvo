// Script para testar atualização de perfil
// Execute com: node scripts/test-profile-update.js

const API_BASE = 'http://localhost:3000';

async function testProfileUpdate() {
  console.log('🧪 Testando atualização de perfil...\n');

  // Primeiro, você precisa ter um token de usuário válido
  // Este é um exemplo de como testar - você precisará de um token real
  
  const testToken = 'SEU_TOKEN_AQUI'; // Substitua por um token real
  
  if (testToken === 'SEU_TOKEN_AQUI') {
    console.log('❌ Você precisa fornecer um token válido para testar');
    console.log('📝 Para obter um token:');
    console.log('1. Faça login no frontend');
    console.log('2. Abra o DevTools > Application > Local Storage');
    console.log('3. Procure por "supabase.auth.token"');
    console.log('4. Copie o access_token e cole aqui');
    return;
  }

  try {
    // 1. Testar busca de perfil
    console.log('1️⃣ Testando busca de perfil...');
    const getResponse = await fetch(`${API_BASE}/api/profile/update`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
    });

    const getResult = await getResponse.json();
    console.log('📋 Perfil atual:', getResult);

    if (!getResponse.ok) {
      console.error('❌ Erro ao buscar perfil:', getResult);
      return;
    }

    // 2. Testar atualização de perfil
    console.log('\n2️⃣ Testando atualização de perfil...');
    
    const updateData = {
      first_name: 'João',
      last_name: 'Silva',
      bio: 'Desenvolvedor Full Stack com 5 anos de experiência',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      job_title: 'Senior Developer',
      company: 'Tech Corp',
      experience_years: 5,
      mentorship_topics: ['JavaScript', 'React', 'Node.js'],
      session_price_usd: 50
    };

    const updateResponse = await fetch(`${API_BASE}/api/profile/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();
    console.log('📝 Resultado da atualização:', updateResult);

    if (!updateResponse.ok) {
      console.error('❌ Erro na atualização:', updateResult);
      return;
    }

    console.log('✅ Perfil atualizado com sucesso!');

    // 3. Verificar se a atualização foi salva
    console.log('\n3️⃣ Verificando se a atualização foi salva...');
    
    const verifyResponse = await fetch(`${API_BASE}/api/profile/update`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyResult = await verifyResponse.json();
    console.log('🔍 Perfil após atualização:', verifyResult);

    console.log('\n🎉 Teste de atualização de perfil concluído!');

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

// Função para testar upload de foto (exemplo)
async function testPhotoUpload() {
  console.log('\n📸 Para testar upload de foto:');
  console.log('1. Use um cliente HTTP como Postman ou Insomnia');
  console.log('2. Faça POST para http://localhost:3000/api/upload/profile-photo');
  console.log('3. Headers: Authorization: Bearer SEU_TOKEN');
  console.log('4. Body: form-data com campo "file" contendo uma imagem');
  console.log('5. A foto será salva no bucket "profile-photos"');
  console.log('6. O campo avatar_url do perfil será atualizado automaticamente');
}

// Executar testes
testProfileUpdate();
testPhotoUpload();