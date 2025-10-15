#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function reactivateMentors() {
  console.log('\n🔄 Reativando mentores após evento...\n')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ availability_status: 'available' })
      .in('id', 
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'mentor')
      )
      .select('id, full_name')

    if (error) throw error

    console.log(`✅ ${data?.length || 0} mentor(es) reativados!\n`)
    
    data?.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.full_name}`)
    })
    
    console.log('\n✅ Todos os mentores estão disponíveis novamente!\n')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

reactivateMentors().then(() => process.exit(0))
