#!/usr/bin/env node

/**
 * Script to setup specific users with roles and complete profiles
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('👥 Configurando Usuários Específicos')
console.log('===================================')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// User configurations
const USERS_CONFIG = {
  'b64b6a94-6a52-47c4-944f-960d1dc9f570': {
    role: 'mentor',
    profile: {
      first_name: 'Ismaela',
      last_name: 'Silva',
      full_name: 'Ismaela Silva',
      bio: 'Mentora experiente em tecnologia e desenvolvimento de carreira. Especialista em liderança e gestão de equipes.',
      job_title: 'Tech Lead',
      company: 'TechCorp',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      linkedin_url: 'https://linkedin.com/in/ismaela-silva',
      verified: true,
      expertise_areas: ['JavaScript', 'React', 'Node.js', 'Leadership'],
      mentorship_topics: ['Desenvolvimento de Carreira', 'Liderança Técnica', 'Gestão de Equipes'],
      experience_years: 8,
      availability_status: 'available'
    },
    availability: [
      { day_of_week: 1, start_time: '09:00', end_time: '12:00', timezone: 'America/Sao_Paulo' }, // Segunda
      { day_of_week: 3, start_time: '14:00', end_time: '17:00', timezone: 'America/Sao_Paulo' }, // Quarta
      { day_of_week: 5, start_time: '10:00', end_time: '16:00', timezone: 'America/Sao_Paulo' }  // Sexta
    ]
  },
  '7be27332-e84e-47eb-8a11-c3b315cec0a6': {
    role: 'admin',
    profile: {
      first_name: 'Paul',
      last_name: 'Pessoa',
      full_name: 'Paul Pessoa',
      bio: 'Administrador do sistema com experiência em gestão de plataformas e suporte técnico.',
      job_title: 'System Administrator',
      company: 'MENVO',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil',
      verified: true,
      availability_status: 'unavailable'
    }
  }
}

async function getUserInfo(userId) {
  console.log(`\n🔍 Verificando usuário: ${userId}`)
  
  try {
    // Get user from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.log(`❌ Usuário não encontrado no auth: ${authError?.message || 'User not found'}`)
      return null
    }
    
    console.log(`✅ Usuário encontrado: ${authUser.user.email}`)
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    // Get current role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select(`roles (name)`)
      .eq('user_id', userId)
      .single()
    
    return {
      authUser: authUser.user,
      profile,
      currentRole: roleData?.roles?.name || null
    }
    
  } catch (error) {
    console.error(`❌ Erro ao verificar usuário ${userId}:`, error.message)
    return null
  }
}

async function setUserRole(userId, roleName) {
  console.log(`\n🔄 Definindo role '${roleName}' para usuário ${userId}`)
  
  try {
    // Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single()
    
    if (roleError) {
      console.error(`❌ Role '${roleName}' não encontrada:`, roleError.message)
      return false
    }
    
    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role_id: roleData.id })
        .eq('user_id', userId)
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar role:`, updateError.message)
        return false
      }
      
      console.log(`✅ Role atualizada para '${roleName}'`)
    } else {
      // Create new role assignment
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id
        })
      
      if (insertError) {
        console.error(`❌ Erro ao criar role:`, insertError.message)
        return false
      }
      
      console.log(`✅ Role '${roleName}' criada com sucesso`)
    }
    
    return true
    
  } catch (error) {
    console.error(`❌ Erro ao definir role:`, error.message)
    return false
  }
}

async function updateUserProfile(userId, profileData) {
  console.log(`\n🔄 Atualizando perfil do usuário ${userId}`)
  
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    const profileUpdate = {
      ...profileData,
      updated_at: new Date().toISOString()
    }
    
    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar perfil:`, updateError.message)
        return false
      }
      
      console.log(`✅ Perfil atualizado com sucesso`)
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileUpdate
        })
      
      if (insertError) {
        console.error(`❌ Erro ao criar perfil:`, insertError.message)
        return false
      }
      
      console.log(`✅ Perfil criado com sucesso`)
    }
    
    return true
    
  } catch (error) {
    console.error(`❌ Erro ao atualizar perfil:`, error.message)
    return false
  }
}

async function setupMentorAvailability(mentorId, availabilitySlots) {
  console.log(`\n🔄 Configurando disponibilidade para mentor ${mentorId}`)
  
  try {
    // Remove existing availability
    await supabase
      .from('mentor_availability')
      .delete()
      .eq('mentor_id', mentorId)
    
    // Insert new availability slots
    const availabilityData = availabilitySlots.map(slot => ({
      mentor_id: mentorId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: slot.timezone,
      is_active: true
    }))
    
    const { error: insertError } = await supabase
      .from('mentor_availability')
      .insert(availabilityData)
    
    if (insertError) {
      console.error(`❌ Erro ao criar disponibilidade:`, insertError.message)
      return false
    }
    
    console.log(`✅ ${availabilitySlots.length} slots de disponibilidade criados`)
    
    // Log the created slots
    availabilitySlots.forEach(slot => {
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      console.log(`   • ${dayNames[slot.day_of_week]}: ${slot.start_time} - ${slot.end_time}`)
    })
    
    return true
    
  } catch (error) {
    console.error(`❌ Erro ao configurar disponibilidade:`, error.message)
    return false
  }
}

async function setupUser(userId, config) {
  console.log(`\n🎯 Configurando usuário: ${userId}`)
  console.log(`   Role: ${config.role}`)
  console.log(`   Nome: ${config.profile.full_name}`)
  
  // Get current user info
  const userInfo = await getUserInfo(userId)
  if (!userInfo) {
    console.log(`❌ Usuário ${userId} não pode ser configurado`)
    return false
  }
  
  console.log(`   Email: ${userInfo.authUser.email}`)
  console.log(`   Role atual: ${userInfo.currentRole || 'Nenhuma'}`)
  
  // Set role
  const roleSuccess = await setUserRole(userId, config.role)
  if (!roleSuccess) {
    console.log(`❌ Falha ao definir role para ${userId}`)
    return false
  }
  
  // Update profile
  const profileSuccess = await updateUserProfile(userId, config.profile)
  if (!profileSuccess) {
    console.log(`❌ Falha ao atualizar perfil para ${userId}`)
    return false
  }
  
  // Setup mentor availability if user is mentor
  if (config.role === 'mentor' && config.availability) {
    const availabilitySuccess = await setupMentorAvailability(userId, config.availability)
    if (!availabilitySuccess) {
      console.log(`❌ Falha ao configurar disponibilidade para ${userId}`)
      return false
    }
  }
  
  console.log(`✅ Usuário ${userId} configurado com sucesso!`)
  return true
}

async function main() {
  try {
    console.log('🎯 Iniciando configuração de usuários específicos...')
    
    let successCount = 0
    let totalUsers = Object.keys(USERS_CONFIG).length
    
    for (const [userId, config] of Object.entries(USERS_CONFIG)) {
      const success = await setupUser(userId, config)
      if (success) {
        successCount++
      }
    }
    
    console.log('\n📊 Resumo da Configuração:')
    console.log('=========================')
    console.log(`✅ Usuários configurados: ${successCount}/${totalUsers}`)
    
    if (successCount === totalUsers) {
      console.log('\n🎉 Todos os usuários foram configurados com sucesso!')
    } else {
      console.log('\n⚠️  Alguns usuários não puderam ser configurados')
    }
    
    console.log('\n📋 Usuários configurados:')
    for (const [userId, config] of Object.entries(USERS_CONFIG)) {
      console.log(`• ${userId} → ${config.role} (${config.profile.full_name})`)
    }
    
    console.log('\n🔍 Para verificar as configurações:')
    console.log('1. Acesse o Supabase Dashboard')
    console.log('2. Verifique as tabelas: profiles, user_roles, mentor_availability')
    console.log('3. Teste o login com esses usuários')
    
  } catch (error) {
    console.error('\n❌ Erro durante configuração:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}