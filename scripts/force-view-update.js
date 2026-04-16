require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'evxrzmzkghshjmmyegxu';
const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to remote Supabase DB');
    
    const sql = fs.readFileSync('supabase/migrations/20260416120000_add_organizations_to_mentors_view.sql', 'utf8');
    
    console.log('Force applying view update...');
    await client.query(sql);
    console.log('View updated successfully with job_title column!');
    
  } catch (err) {
    console.error('Error updating view:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
