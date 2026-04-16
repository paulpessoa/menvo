require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'evxrzmzkghshjmmyegxu';
const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const userId = '0737122a-0579-4981-9802-41883d6563a3';
    const convIds = [
      'fb9a0736-11fe-4b3c-95fe-a28a27788f15',
      '0755c665-556e-402c-84fb-bad05bfee2e3',
      '8994258c-cd52-434b-938b-9654a5ac5767',
      '1c89000f-f800-4009-8bbf-5287aa71aefa'
    ];

    console.log('--- Checking Conversations participation ---');
    const convCheck = await client.query(`
      SELECT id, mentor_id, mentee_id 
      FROM public.conversations 
      WHERE id = ANY($1)
    `, [convIds]);
    console.log(convCheck.rows);

    console.log('\n--- Checking ALL messages for these conversations ---');
    const msgCheck = await client.query(`
      SELECT id, conversation_id, sender_id, content, created_at, read_at
      FROM public.messages 
      WHERE conversation_id = ANY($1)
      ORDER BY created_at ASC
    `, [convIds]);
    console.log(msgCheck.rows);

    console.log('\n--- Checking active organizations ---');
    const orgCheck = await client.query(`
      SELECT id, name, status FROM public.organizations WHERE status = 'active'
    `);
    console.log(orgCheck.rows);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
