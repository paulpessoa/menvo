require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'evxrzmzkghshjmmyegxu';
const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log('--- Public Tables ---');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(res.rows.map(r => r.table_name));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
