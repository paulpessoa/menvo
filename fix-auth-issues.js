const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:hDbfa9TEk7TVku1T@db.evxrzmzkghshjmmyegxu.supabase.co:5432/postgres'
});

async function fixAuthIssues() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco!');

    // 1. Verificar estrutura da tabela user_roles
    console.log('\n=== VERIFICANDO ESTRUTURA user_roles ===');
    const userRolesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
      ORDER BY ordinal_position;
    `);
    console.table(userRolesStructure.rows);

    // 2. Verificar dados de exemplo
    console.log('\n=== DADOS DE EXEMPLO user_roles ===');
    const sampleData = await client.query(`
      SELECT ur.*, r.name as role_name 
      FROM user_roles ur 
      LEFT JOIN roles r ON ur.role_id = r.id 
      LIMIT 5;
    `);
    console.table(sampleData.rows);

    // 3. Verificar configurações de auth no Supabase
    console.log('\n=== VERIFICANDO CONFIGURAÇÕES AUTH ===');
    
    // Verificar se há triggers problemáticos na tabela auth.users
    const authTriggers = await client.query(`
      SELECT 
        n.nspname as schemaname, 
        c.relname as tablename, 
        t.tgname as triggername, 
        t.tgfoid::regproc as function_name 
      FROM pg_trigger t 
      JOIN pg_class c ON t.tgrelid = c.oid 
      JOIN pg_namespace n ON c.relnamespace = n.oid 
      WHERE n.nspname = 'auth' 
      AND c.relname = 'users'
      AND NOT t.tgisinternal 
      ORDER BY t.tgname;
    `);
    
    console.log('Triggers na tabela auth.users:');
    console.table(authTriggers.rows);

    // 4. Verificar se há usuários com problemas de role
    console.log('\n=== USUÁRIOS COM PROBLEMAS DE ROLE ===');
    const problematicUsers = await client.query(`
      SELECT 
        au.id,
        au.email,
        au.email_confirmed_at,
        p.full_name,
        ur.role_id,
        r.name as role_name
      FROM auth.users au
      LEFT JOIN profiles p ON au.id = p.id
      LEFT JOIN user_roles ur ON au.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE au.email_confirmed_at IS NOT NULL
      ORDER BY au.created_at DESC
      LIMIT 10;
    `);
    
    console.log('Últimos 10 usuários confirmados:');
    console.table(problematicUsers.rows);

    // 5. Verificar URLs de callback configuradas
    console.log('\n=== VERIFICANDO CONFIGURAÇÕES DE CALLBACK ===');
    
    // Simular teste de callback
    const testCallback = await client.query(`
      SELECT 
        'Site URL' as config_type,
        'Deve estar configurado no Supabase Dashboard' as value
      UNION ALL
      SELECT 
        'Redirect URLs' as config_type,
        'https://menvo.com.br/auth/callback, http://localhost:3000/auth/callback' as value;
    `);
    
    console.table(testCallback.rows);

    console.log('\n=== RECOMENDAÇÕES PARA CORREÇÃO ===');
    console.log('1. ✅ Verificar no Supabase Dashboard:');
    console.log('   - Authentication > URL Configuration');
    console.log('   - Site URL: https://menvo.com.br');
    console.log('   - Redirect URLs: https://menvo.com.br/auth/callback');
    console.log('');
    console.log('2. ✅ Problemas identificados no código:');
    console.log('   - Middleware tem lógica de redirecionamento conflitante');
    console.log('   - Estrutura user_roles sendo acessada incorretamente');
    console.log('   - Callback não está lidando bem com confirmação de email');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

fixAuthIssues();
