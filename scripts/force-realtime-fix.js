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
    
    console.log('Enabling REPLICA IDENTITY FULL for chat tables...');
    await client.query('ALTER TABLE public.messages REPLICA IDENTITY FULL;');
    await client.query('ALTER TABLE public.conversations REPLICA IDENTITY FULL;');
    console.log('Replica Identity updated successfully!');
    
  } catch (err) {
    console.error('Error updating tables:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
