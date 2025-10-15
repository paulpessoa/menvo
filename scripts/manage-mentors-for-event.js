#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function listAllMentors() {
  console.log('\n📋 Listando todos os mentores...\n')
  
  try {
    const { data, error } = await supabase
      .from('mentors_view')
      .select('id, full_name, avatar_url, availability_status, mentorship_topics, sessions')
      .order('full_name', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.log('⚠️  Nenhum mentor encontrado')
      return []
    }

    console.log(`✅ Total de mentores: ${data.length}\n`)
    
    data.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.full_name}`)
      console.log(`   ID: ${mentor.id}`)
      console.log(`   Foto: ${mentor.avatar_url ? '✅ Sim' : '❌ Não'}`)
      console.log(`   Status: ${mentor.availability_status}`)
      console.log(`   Sessões: ${mentor.sessions || 0}`)
      console.log(`   Tópicos: ${mentor.mentorship_topics?.join(', ') || 'Nenhum'}`)
      console.log('')
    })

    return data
  } catch (error) {
    console.error('❌ Erro ao listar mentores:', error.message)
    return []
  }
}

async function findMentorsWithoutPhotos() {
  console.log('\n🔍 Buscando mentores sem foto...\n')
  
  try {
    const { data, error } = await supabase
      .from('mentors_view')
      .select('id, full_name, avatar_url, availability_status')
      .or('avatar_url.is.null,avatar_url.eq.')
      .order('full_name', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.log('✅ Todos os mentores têm foto!')
      return []
    }

    console.log(`⚠️  ${data.length} mentor(es) sem foto:\n`)
    
    data.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.full_name}`)
      console.log(`   ID: ${mentor.id}`)
      console.log(`   Status: ${mentor.availability_status}`)
      console.log('')
    })

    return data
  } catch (error) {
    console.error('❌ Erro ao buscar mentores sem foto:', error.message)
    return []
  }
}

async function updateMentorPhoto(mentorId, photoUrl) {
  console.log(`\n📸 Atualizando foto do mentor ${mentorId}...\n`)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: photoUrl })
      .eq('id', mentorId)
      .select()

    if (error) throw error

    console.log('✅ Foto atualizada com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao atualizar foto:', error.message)
    return false
  }
}

async function setAllMentorsBusy() {
  console.log('\n⏳ Definindo todos os mentores como ocupados...\n')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ availability_status: 'busy' })
      .in('active_roles', ['mentor'])
      .select('id, full_name')

    if (error) throw error

    console.log(`✅ ${data?.length || 0} mentor(es) definidos como ocupados!`)
    return true
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error.message)
    return false
  }
}

async function updateMentorPhotoInteractive() {
  const mentorId = await question('Digite o ID do mentor: ')
  const photoUrl = await question('Digite a URL da foto: ')
  
  if (!mentorId || !photoUrl) {
    console.log('❌ ID e URL são obrigatórios')
    return
  }

  await updateMentorPhoto(mentorId.trim(), photoUrl.trim())
}

async function showMenu() {
  console.log('\n' + '='.repeat(50))
  console.log('🎯 GERENCIADOR DE MENTORES PARA EVENTO')
  console.log('='.repeat(50))
  console.log('\n1. Listar todos os mentores')
  console.log('2. Encontrar mentores sem foto')
  console.log('3. Atualizar foto de um mentor')
  console.log('4. Definir todos os mentores como ocupados')
  console.log('5. Sair\n')

  const choice = await question('Escolha uma opção (1-5): ')

  switch (choice.trim()) {
    case '1':
      await listAllMentors()
      await showMenu()
      break
    case '2':
      await findMentorsWithoutPhotos()
      await showMenu()
      break
    case '3':
      await updateMentorPhotoInteractive()
      await showMenu()
      break
    case '4':
      const confirm = await question('⚠️  Tem certeza? Isso afetará TODOS os mentores (s/n): ')
      if (confirm.toLowerCase() === 's') {
        await setAllMentorsBusy()
      } else {
        console.log('❌ Operação cancelada')
      }
      await showMenu()
      break
    case '5':
      console.log('\n👋 Até logo!\n')
      rl.close()
      process.exit(0)
      break
    default:
      console.log('❌ Opção inválida')
      await showMenu()
  }
}

// Iniciar o menu
showMenu().catch(error => {
  console.error('❌ Erro fatal:', error)
  rl.close()
  process.exit(1)
})
