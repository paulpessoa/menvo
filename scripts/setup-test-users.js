
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
  const users = [
    { email: 'admin@estagiorecife.com.br', role: 'admin' },
    { email: 'member@estagiorecife.com.br', role: 'mentee' }
  ];

  console.log('🚀 Criando usuários de teste...');

  // Pegar ID da Org
  const orgId = '5e69e8a1-d2ca-4f31-9726-99c18bacbdae';

  for (const u of users) {
    // 1. Criar na Auth (com senha bypassando email confirm)
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: '@EstagioRecife.2026',
      email_confirm: true
    });

    if (authErr && !authErr.message.includes('already exists')) {
      console.error(`Erro ao criar ${u.email}:`, authErr.message);
      continue;
    }

    const userId = authUser.user?.id || (await supabase.from('profiles').select('id').eq('email', u.email).single()).data?.id;
    
    if (userId) {
      // 2. Vincular na Org
      const { error: linkErr } = await supabase.from('organization_members').upsert({
        organization_id: org.id,
        user_id: userId,
        role: u.role,
        status: 'active'
      }, { onConflict: 'organization_id, user_id' });

      if (linkErr) console.error(`Erro ao vincular ${u.email}:`, linkErr.message);
      else console.log(`✅ ${u.email} pronto!`);
    }
  }
}

setup();
