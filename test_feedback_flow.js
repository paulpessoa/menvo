const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evxrzmzkghshjmmyegxu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  console.log("=== INICIANDO TESTE DO FLUXO DE FEEDBACK ===");
  
  // 1. Create a test user
  const email = `test_${Date.now()}@example.com`;
  const password = 'testpassword123';
  
  console.log(`\n1. Criando usuário de teste: ${email}`);
  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (adminError) {
    console.error("Erro ao criar usuário:", adminError.message);
    process.exit(1);
  }
  console.log("Usuário criado com sucesso:", adminUser.user.id);
  
  // 2. Sign in to get session cookies
  console.log("\n2. Fazendo login para obter a sessão...");
  
  // Initialize standard client to get session
  const client = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: sessionData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) {
    console.error("Erro ao fazer login:", signInError.message);
  } else {
    console.log("Login bem-sucedido! Access Token obtido.");
  }
  
  // 3. Test API endpoint (Local)
  console.log("\n3. Testando o endpoint LOCAL (/api/feedback)...");
  try {
    const res = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Next.js Supabase auth usually relies on cookies, but passing Authorization header sometimes works if the API is configured for it, 
        // though standard Next.js SSR middleware uses cookies. We'll try without auth for the anonymous flow first, 
        // then with the token just in case.
      },
      body: JSON.stringify({
        rating: 5,
        comment: "Teste de script automatizado",
        email: "anon@example.com",
        page_url: "http://localhost:3000/test"
      })
    });
    
    const text = await res.text();
    console.log(`Status HTTP Local: ${res.status}`);
    console.log(`Resposta Local: ${text}`);
  } catch (err) {
    console.error("Erro ao chamar API local:", err.message);
  }
  
  // 4. Test API endpoint (Online)
  console.log("\n4. Testando o endpoint ONLINE (https://menvo.com.br/api/feedback)...");
  try {
    const res = await fetch('https://menvo.com.br/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: 4,
        comment: "Teste de script automatizado ONLINE",
        email: "anon_online@example.com",
        page_url: "https://menvo.com.br/test"
      })
    });
    
    const text = await res.text();
    console.log(`Status HTTP Online: ${res.status}`);
    console.log(`Resposta Online: ${text}`);
  } catch (err) {
    console.error("Erro ao chamar API online:", err.message);
  }

  // Cleanup
  console.log("\n5. Limpando usuário de teste...");
  await supabase.auth.admin.deleteUser(adminUser.user.id);
  console.log("Usuário de teste removido.");
  
  console.log("\n=== TESTE CONCLUÍDO ===");
}

runTest();
