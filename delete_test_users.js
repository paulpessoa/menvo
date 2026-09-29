const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabaseUrl or supabaseKey in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .or('full_name.ilike.%usertest%,email.ilike.%usertest%');

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Found users to delete:", data);

  for (const user of data) {
    // delete from auth.users (will cascade to public.users)
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Error deleting user ${user.id}:`, delError);
    } else {
      console.log(`Successfully deleted user ${user.id} (${user.full_name} / ${user.email})`);
    }
  }
}

run();
