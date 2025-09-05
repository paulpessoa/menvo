#!/usr/bin/env node

/**
 * Script para criar mentores via API administrativa
 * Usa a API /admin/users/manage que já implementamos
 */

require('dotenv').config({ path: '.env.local' })

// Dados dos mentores para criar
const mentorsData = [
  {
    email: 'ana.silva.mentor@menvo.com',
    password: 'MentorPass123!',
    full_name: 'Ana Silva',
    user_role: 'mentor'
  },
  {
    email: 'carlos.santos.mentor@menvo.com',
    password: 'MentorPass123!',
    full_name: 'Carlos Santos',
    user_role: 'mentor'
  },
  {
    email: 'mariana.costa.mentor@menvo.com',
    password: 'MentorPass123!',
    full_name: 'Mariana Costa',
    user_role: 'mentor'
  },
  {
    email: 'roberto.oliveira.mentor@menvo.com',
    password: 'MentorPass123!',
    full_name: 'Roberto Oliveira',
    user_role: 'mentor'
  }
]

/**
 * Cria mentor via API
 */
async function createMentorViaAPI(mentorData) {
  try {
    console.log(`🔧 Criando mentor: ${mentorData.email}...`)

    const response = await fetch('http://localhost:3000/api/admin/users/manage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Aqui você precisaria do token de autenticação do admin
        // Por simplicidade, vamos usar o service role diretamente
      },
      body: JSON.stringify(mentorData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar mentor')
    }

    console.log(`✅ Mentor criado: ${mentorData.email}`)
    return result
  } catch (error) {
    console.error(`❌ Erro ao criar mentor ${mentorData.email}:`, error.message)
    return null
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Criando mentores via API...\n')

    let mentorsCreated = 0
    
    for (const mentorData of mentorsData) {
      const result = await createMentorViaAPI(mentorData)
      if (result) {
        mentorsCreated++
      }
      
      // Pausa entre criações
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n✅ ${mentorsCreated} mentores criados com sucesso!`)

    if (mentorsCreated > 0) {
      console.log('\n👥 MENTORES CRIADOS:')
      mentorsData.slice(0, mentorsCreated).forEach((mentor, index) => {
        console.log(`${index + 1}. ${mentor.full_name} (${mentor.email})`)
      })
    }

    console.log('\n🎉 Criação de mentores concluída!')

  } catch (error) {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}