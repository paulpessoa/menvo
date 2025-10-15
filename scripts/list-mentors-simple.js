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

async function listMentors() {
  console.log('\n📋 Listando mentores...\n')
  
  try {
    const { data, error } = await supabase
      .from('mentors_view')
      .select('id, full_name, current_position, avatar_url, availability_status, sessions')
      .order('full_name', { ascending: true })

    if (error) throw error

    console.log(`✅ Total de mentores: ${data?.length || 0}\n`)
    
    data?.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.full_name}`)
      console.log(`   Cargo: ${mentor.current_position || 'N/A'}`)
      console.log(`   Status: ${mentor.availability_status}`)
      console.log(`   Foto: ${mentor.avatar_url ? '✅' : '❌'}`)
      console.log(`   Sessões: ${mentor.sessions || 0}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

listMentors().then(() => process.exit(0))
