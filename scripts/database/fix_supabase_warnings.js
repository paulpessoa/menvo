const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = projectUrl.replace('https://', '').replace('.supabase.co', '');
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

// Pooling URL format for Supabase
const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Production database successfully.');

    // 1. Fix public.roles RLS disabled
    console.log('Fixing public.roles RLS...');
    await client.query(`ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;`);
    // Safe policy, allowing all authenticated and anon to read roles (usually needed for app to function)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'roles' 
            AND policyname = 'roles_read_all'
        ) THEN
            CREATE POLICY "roles_read_all" ON public.roles FOR SELECT USING (true);
        END IF;
      END
      $$;
    `);
    console.log('  -> public.roles RLS enabled with select policy.');

    // 2. Fix SECURITY DEFINER on views (Set security_invoker = true)
    console.log('Fixing SECURITY DEFINER on mentors_admin_view...');
    await client.query(`ALTER VIEW IF EXISTS public.mentors_admin_view SET (security_invoker = true);`);
    console.log('  -> mentors_admin_view security_invoker flag set.');

    console.log('Fixing SECURITY DEFINER on mentors_view...');
    await client.query(`ALTER VIEW IF EXISTS public.mentors_view SET (security_invoker = true);`);
    console.log('  -> mentors_view security_invoker flag set.');

    console.log('All Supabase Analyzer warnings addressed successfully!');

  } catch (err) {
    console.error('Execution error:', err.message);
  } finally {
    await client.end();
  }
}

main();
