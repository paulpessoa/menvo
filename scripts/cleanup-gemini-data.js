require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'evxrzmzkghshjmmyegxu';
const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const geminiId = 'ec05237e-9daf-46d8-91c5-a7af825c7507';
    const paulId = '0737122a-0579-4981-9802-41883d6563a3';

    console.log('1. Deletando feedbacks associados às mentorias do Gemini...');
    await client.query(`
      DELETE FROM public.appointment_feedbacks 
      WHERE appointment_id IN (SELECT id FROM public.appointments WHERE mentee_id = $1 OR mentor_id = $1)
    `, [geminiId]);

    console.log('2. Deletando todas as mentorias do Gemini...');
    const delRes = await client.query('DELETE FROM public.appointments WHERE mentee_id = $1 OR mentor_id = $1', [geminiId]);
    console.log(`   Foram removidas ${delRes.rowCount} mentorias.`);

    console.log('\n3. Verificando agendamentos restantes para o Paul...');
    const appts = await client.query('SELECT id, scheduled_at, status FROM public.appointments WHERE mentor_id = $1', [paulId]);
    console.log('   Agendamentos ativos:', appts.rows);

    console.log('\n4. Verificando disponibilidade do Paul novamente...');
    const avail = await client.query('SELECT * FROM public.mentor_availability WHERE mentor_id = $1', [paulId]);
    console.log('   Regras de disponibilidade:', avail.rows);
    
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}

run();
