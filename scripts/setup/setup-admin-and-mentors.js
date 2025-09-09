#!/usr/bin/env node

/**
 * Script para configurar admin e mentores iniciais
 * Define paulmspessoa@gmail.com como admin e cria 4 mentores validados
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Dados dos mentores para criar
const mentorsData = [
  {
    email: 'ana.silva@menvo.com',
    password: 'MentorPass123!',
    first_name: 'Ana',
    last_name: 'Silva',
    bio: 'Desenvolvedora Full Stack com 8 anos de experiência em React, Node.js e Python. Especialista em arquitetura de sistemas e mentoria técnica.',
    expertise_areas: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB']
  },
  {
    email: 'carlos.santos@menvo.com',
    password: 'MentorPass123!',
    first_name: 'Carlos',
    last_name: 'Santos',
    bio: 'Tech Lead e Arquiteto de Software com foco em microserviços e DevOps. 10+ anos ajudando desenvolvedores a crescer na carreira.',
    expertise_areas: ['Java', 'Spring Boot', 'Kubernetes', 'Docker', 'Microservices', 'DevOps']
  },
  {
    email: 'mariana.costa@menvo.com',
    password: 'MentorPass123!',
    first_name: 'Mariana',
    last_name: 'Costa',
    bio: 'Product Manager e UX Designer com background técnico. Especialista em transformação digital e gestão de produtos tech.',
    expertise_areas: ['Product Management', 'UX/UI Design', 'Agile', 'Scrum', 'Data Analysis', 'Figma']
  },
  {
    email: 'roberto.oliveira@menvo.com',
    password: 'MentorPass123!',
    first_name: 'Roberto',
    last_name: 'Oliveira',
    bio: 'Engenheiro de Dados e Machine Learning Engineer. Focado em Big Data, AI e ajudando profissionais a entrar na área de dados.',
    expertise_areas: ['Python', 'Machine Learning', 'Data Science', 'SQL', 'Apache Spark', 'TensorFlow']
  }
]

/**
 * Configura usuário como admin
 */
async function setupAdmin(email) {
  try {
    console.log(`🔧 Configurando ${email} como admin...`)

    // Buscar usuário pelo email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.log(`⚠️  Usuário ${email} não encontrado. Criando...`)
      
      // Criar usuário admin
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'AdminPass123!', // Senha temporária
        email_confirm: true,
        user_metadata: {
          first_name: 'Paulo',
          last_name: 'Pessoa',
          created_by_setup: true
        }
      })

      if (createError) {
        throw new Error(`Erro ao criar usuário admin: ${createError.message}`)
      }

      // Criar perfil
      const { error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email,
          first_name: 'Paulo',
          last_name: 'Pessoa',
          verified: true
        })

      if (newProfileError) {
        throw new Error(`Erro ao criar perfil admin: ${newProfileError.message}`)
      }

      console.log(`✅ Usuário admin criado: ${email}`)
      return authUser.user.id
    }

    console.log(`✅ Usuário encontrado: ${email}`)
    return profile.id
  } catch (error) {
    console.error(`❌ Erro ao configurar admin:`, error)
    throw error
  }
}

/**
 * Atribui role de admin ao usuário
 */
async function assignAdminRole(userId) {
  try {
    console.log('🔧 Atribuindo role de admin...')

    // Buscar ID da role admin
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single()

    if (roleError || !adminRole) {
      throw new Error('Role admin não encontrada')
    }

    // Remover roles existentes
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    // Atribuir role admin
    const { error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: adminRole.id
      })

    if (assignError) {
      throw new Error(`Erro ao atribuir role admin: ${assignError.message}`)
    }

    console.log('✅ Role admin atribuída com sucesso')
  } catch (error) {
    console.error('❌ Erro ao atribuir role admin:', error)
    throw error
  }
}

/**
 * Cria um mentor
 */
async function createMentor(mentorData) {
  try {
    console.log(`🔧 Criando mentor: ${mentorData.email}...`)

    // Verificar se mentor já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', mentorData.email)
      .single()

    if (existingProfile) {
      console.log(`⚠️  Mentor ${mentorData.email} já existe, pulando...`)
      return existingProfile.id
    }

    // Criar usuário mentor
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: mentorData.email,
      password: mentorData.password,
      email_confirm: true,
      user_metadata: {
        first_name: mentorData.first_name,
        last_name: mentorData.last_name,
        created_by_setup: true
      }
    })

    if (createError) {
      throw new Error(`Erro ao criar usuário mentor: ${createError.message}`)
    }

    // Criar perfil do mentor
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: mentorData.email,
        first_name: mentorData.first_name,
        last_name: mentorData.last_name,
        bio: mentorData.bio,
        expertise_areas: mentorData.expertise_areas,
        verified: true // Mentores são criados já verificados
      })

    if (profileError) {
      // Se falhar ao criar perfil, deletar usuário criado
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Erro ao criar perfil do mentor: ${profileError.message}`)
    }

    // Atribuir role de mentor
    const { data: mentorRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'mentor')
      .single()

    if (mentorRole) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role_id: mentorRole.id
        })
    }

    console.log(`✅ Mentor criado: ${mentorData.email}`)
    return authUser.user.id
  } catch (error) {
    console.error(`❌ Erro ao criar mentor ${mentorData.email}:`, error)
    throw error
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando configuração de admin e mentores...\n')

    // 1. Configurar admin
    console.log('📋 ETAPA 1: Configurando Admin')
    const adminUserId = await setupAdmin('paulmspessoa@gmail.com')
    await assignAdminRole(adminUserId)
    console.log('✅ Admin configurado com sucesso!\n')

    // 2. Criar mentores
    console.log('📋 ETAPA 2: Criando Mentores')
    let mentorsCreated = 0
    
    for (const mentorData of mentorsData) {
      try {
        await createMentor(mentorData)
        mentorsCreated++
      } catch (error) {
        console.error(`❌ Falha ao criar mentor ${mentorData.email}:`, error.message)
      }
    }

    console.log(`\n✅ ${mentorsCreated} mentores criados com sucesso!`)

    // 3. Resumo final
    console.log('\n📊 RESUMO DA CONFIGURAÇÃO:')
    console.log('✅ Admin: paulmspessoa@gmail.com')
    console.log(`✅ Mentores criados: ${mentorsCreated}/${mentorsData.length}`)
    
    if (mentorsCreated > 0) {
      console.log('\n👥 MENTORES CRIADOS:')
      mentorsData.slice(0, mentorsCreated).forEach((mentor, index) => {
        console.log(`${index + 1}. ${mentor.first_name} ${mentor.last_name} (${mentor.email})`)
      })
    }

    console.log('\n🎉 Configuração concluída com sucesso!')
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('1. Faça login como admin: paulmspessoa@gmail.com')
    console.log('2. Acesse /admin/users/manage para gerenciar usuários')
    console.log('3. Os mentores podem fazer login com suas credenciais')
    console.log('4. Senhas temporárias podem ser alteradas no primeiro login')

  } catch (error) {
    console.error('❌ Erro fatal na configuração:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = { setupAdmin, assignAdminRole, createMentor }
