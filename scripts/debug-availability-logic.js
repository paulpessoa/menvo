require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'evxrzmzkghshjmmyegxu';
const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const mentorId = '0737122a-0579-4981-9802-41883d6563a3'; // Paul
    
    // 1. Pegar disponibilidade bruta
    const res = await client.query('SELECT * FROM public.mentor_availability WHERE mentor_id = $1', [mentorId]);
    const availability = res.rows;
    console.log('Regras de disponibilidade no banco:', availability);

    // 2. Simular o loop da API
    const startDate = new Date(); // Hoje
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    
    console.log(`\nSimulando de ${startDate.toISOString()} até ${endDate.toISOString()}`);
    
    const availableSlots = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // ESTE É O PONTO CRÍTICO: .toISOString() pode mudar o dia se for tarde da noite!
      const dateString = current.toISOString().split('T')[0];
      
      // Tentativa de pegar o dia da semana
      const dayOfWeek = new Date(`${dateString}T12:00:00`).getDay();
      
      console.log(`Verificando data: ${dateString} -> Dia da semana calculado: ${dayOfWeek}`);

      const dayAvailability = availability.filter(a => Number(a.day_of_week) === dayOfWeek);
      
      if (dayAvailability.length > 0) {
        console.log(`   ✅ Encontrou regra para o dia ${dayOfWeek}`);
        for (const avail of dayAvailability) {
          const [startHour] = avail.start_time.split(':').map(Number);
          const [endHour] = avail.end_time.split(':').map(Number);
          for (let h = startHour; h < endHour; h++) {
            availableSlots.push(`${dateString} ${h}:00`);
          }
        }
      }
      
      current.setDate(current.getDate() + 1);
    }

    console.log('\nSlots gerados na simulação:', availableSlots);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
