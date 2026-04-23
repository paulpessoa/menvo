import type { Database } from './lib/types/supabase'

type T1 = keyof Database['public']['Tables'];
type AppointmentsTable = Database['public']['Tables']['appointments'];
type AppRow = AppointmentsTable['Row'];
type AppUpdate = AppointmentsTable['Update'];

declare const db: Database;
declare const supabase: import('@supabase/supabase-js').SupabaseClient<Database>;

async function test() {
    const { data } = await supabase.from('appointments').select('*');
    data?.[0]?.id; // If data is never, this fails
    
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', 1);
}
