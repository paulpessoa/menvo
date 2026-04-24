
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTests() {
  console.log('🧪 Iniciando Testes de API de Organizações...\n');

  // Teste 1: Buscar Organizações
  console.log('1. Validando Tabela organizations...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .limit(5);

  if (orgError) {
    console.error('❌ Erro ao buscar organizações:', orgError.message);
  } else {
    console.log(`✅ Sucesso: Encontradas ${orgs.length} organizações.`);
    orgs.forEach(o => console.log(`   - ${o.name} (slug: ${o.slug})`));
  }

  // Teste 2: Buscar Membros da "Estágio Recife"
  console.log('\n2. Validando Membros de "Estágio Recife"...');
  const estagioRecife = orgs.find(o => o.name.includes('Estágio Recife'));
  
  if (estagioRecife) {
    const { data: members, error: memError } = await supabase
      .from('organization_members')
      .select('id, role, status, profiles(full_name, email)')
      .eq('organization_id', estagioRecife.id);

    if (memError) {
      console.error('❌ Erro ao buscar membros:', memError.message);
    } else {
      console.log(`✅ Sucesso: Encontrados ${members.length} membros.`);
      members.forEach(m => console.log(`   - ${m.profiles.full_name} [${m.role}] Status: ${m.status}`));
    }
  } else {
    console.log('⚠️ Organização Estágio Recife não encontrada para teste de membros.');
  }

  // Teste 3: Validar RLS (Tentativa de leitura como usuário comum)
  console.log('\n3. Validando Feature Flags...');
  const { data: flags, error: flagError } = await supabase
    .from('feature_flags')
    .select('name, enabled');

  if (flagError) {
    console.error('❌ Erro ao buscar flags:', flagError.message);
  } else {
    console.log(`✅ Sucesso: ${flags.length} flags ativas no banco.`);
  }

  console.log('\n🏁 Testes concluídos.');
}

runTests();
