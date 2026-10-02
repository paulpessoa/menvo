import { createClient } from '@supabase/supabase-js'

// Load environment variables from menvo
import * as dotenv from 'dotenv'
dotenv.config({ path: 'c:/Users/paulm/OneDrive/Ambiente de Trabalho/PROJETOS/menvo/.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: user } = await supabase.from('profiles').select('id').eq('email', 'paulmspessoa@gmail.com').single()
  
  const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        // Mock authorization for test
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      }
    }
  })
  // Wait, service role bypasses RLS. We need a token or we can just fetch the user's data using service role.
  // Wait, if RLS fails, the query just returns empty array instead of throwing an error!
  // Unless it's a syntax error.
  
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, status, created_at, organizations(id, slug, name, type, status)")
    .eq("user_id", user?.id)

  if (error) {
    console.error("ERROR:", error)
  } else {
    console.log("DATA LENGTH:", data?.length)
  }
}

main()
