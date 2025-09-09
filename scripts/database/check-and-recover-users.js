const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentState() {
  console.log('🔍 Verificando estado atual dos usuários...\n');
  
  // Verificar auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  console.log('📊 Usuários em auth.users:', authUsers?.users?.length || 0);
  
  if (authUsers?.users?.length > 0) {
    console.log('Usuários encontrados em auth.users:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}, Criado: ${user.created_at})`);
    });
  }
  
  // Verificar profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
    
  console.log('\n📊 Perfis em profiles:', profiles?.length || 0);
  
  if (profiles?.length > 0) {
    console.log('Perfis encontrados:');
    profiles.forEach(profile => {
      console.log(`- ${profile.email} (Tipo: ${profile.user_type}, ID: ${profile.id})`);
    });
  }
  
  return { authUsers: authUsers?.users || [], profiles: profiles || [] };
}

async function recoverUsers() {
  console.log('\n🔄 Iniciando recuperação de usuários...\n');
  
  const { authUsers, profiles } = await checkCurrentState();
  
  // Encontrar perfis que não têm usuário correspondente em auth.users
  const orphanedProfiles = profiles.filter(profile => 
    !authUsers.find(user => user.email === profile.email)
  );
  
  console.log(`\n🚨 Perfis órfãos encontrados: ${orphanedProfiles.length}`);
  
  if (orphanedProfiles.length === 0) {
    console.log('✅ Todos os perfis têm usuários correspondentes em auth.users');
    return;
  }
  
  console.log('\n🔧 Tentando recriar usuários em auth.users...');
  
  for (const profile of orphanedProfiles) {
    try {
      console.log(`\n📝 Recriando usuário: ${profile.email}`);
      
      // Tentar recriar o usuário com o mesmo ID
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: 'TempPassword123!', // Senha temporária
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name,
          user_type: profile.user_type
        }
      });
      
      if (error) {
        console.log(`❌ Erro ao recriar ${profile.email}:`, error.message);
        continue;
      }
      
      console.log(`✅ Usuário recriado: ${profile.email} (Novo ID: ${newUser.user.id})`);
      
      // Atualizar o profile com o novo ID do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ id: newUser.user.id })
        .eq('email', profile.email);
        
      if (updateError) {
        console.log(`⚠️ Erro ao atualizar profile para ${profile.email}:`, updateError.message);
      } else {
        console.log(`✅ Profile atualizado com novo ID para ${profile.email}`);
      }
      
    } catch (err) {
      console.log(`❌ Erro inesperado ao processar ${profile.email}:`, err.message);
    }
  }
  
  console.log('\n🔍 Verificando estado final...');
  await checkCurrentState();
}

// Executar
recoverUsers().catch(console.error);
