// Script para verificar o status na produção
// Execute com: node scripts/check-production-status.js

const { createClient } = require('@supabase/supabase-js');

// Você precisa configurar essas variáveis com suas credenciais de produção
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkProductionStatus() {
  console.log('🔍 Verificando status da produção...\n');

  try {
    // 1. Verificar quantos usuários existem no auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários do auth:', authError);
    } else {
      console.log(`👥 Total de usuários no auth: ${authUsers.users.length}`);
    }

    // 2. Verificar quantos perfis existem
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError);
    } else {
      console.log(`📋 Total de perfis: ${profiles.length}`);
    }

    // 3. Verificar mentores verificados
    const { data: verifiedMentors, error: mentorsError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, verified')
      .eq('verified', true);

    if (mentorsError) {
      console.error('❌ Erro ao buscar mentores verificados:', mentorsError);
    } else {
      console.log(`✅ Mentores verificados: ${verifiedMentors.length}`);
      if (verifiedMentors.length > 0) {
        console.log('📝 Lista de mentores verificados:');
        verifiedMentors.forEach(mentor => {
          console.log(`   - ${mentor.first_name} ${mentor.last_name} (${mentor.email})`);
        });
      }
    }

    // 4. Verificar mentores pendentes
    const { data: pendingMentors, error: pendingError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, verified')
      .eq('verified', false);

    if (pendingError) {
      console.error('❌ Erro ao buscar mentores pendentes:', pendingError);
    } else {
      console.log(`⏳ Mentores pendentes de verificação: ${pendingMentors.length}`);
      if (pendingMentors.length > 0) {
        console.log('📝 Lista de mentores pendentes:');
        pendingMentors.forEach(mentor => {
          console.log(`   - ${mentor.first_name} ${mentor.last_name} (${mentor.email})`);
        });
      }
    }

    console.log('\n🎯 Próximos passos:');
    console.log('1. Teste registrar um novo usuário na produção');
    console.log('2. Verifique se o perfil é criado automaticamente');
    console.log('3. Aprove mentores pendentes se necessário');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkProductionStatus();
