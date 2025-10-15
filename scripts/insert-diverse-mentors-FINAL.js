#!/usr/bin/env node

/**
 * Script para inserir mentores diversos no Supabase remoto
 * Baseado na estrutura REAL das tabelas do banco de produção
 * 
 * Estrutura da tabela profiles (campos relevantes):
 * - first_name, last_name (full_name é GENERATED)
 * - bio, avatar_url, slug
 * - job_title, company, experience_years
 * - city, state, country, timezone
 * - languages (TEXT[])
 * - mentorship_topics (TEXT[])
 * - expertise_areas (TEXT[])
 * - inclusive_tags (TEXT[])
 * - session_price_usd (DECIMAL)
 * - availability_status (TEXT: 'available', 'busy', 'unavailable')
 * - linkedin_url, github_url, twitter_url, website_url, phone
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔗 Conectando ao Supabase:', supabaseUrl)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mentores diversos - ESTRUTURA CORRETA
const diverseMentors = [
  {
    email: 'ana.ferreira.pedagoga.2024@menvo.com.br',
    first_name: 'Ana Paula',
    last_name: 'Ferreira',
    bio: 'Pedagoga com 15 anos de experiência em educação infantil e fundamental. Apaixonada por metodologias ativas e inclusão escolar.',
    job_title: 'Professora Pedagoga',
    company: 'Escola Municipal Santos Dumont',
    mentorship_topics: ['Educação', 'Pedagogia', 'Metodologias Ativas', 'Inclusão Escolar', 'Alfabetização'],
    expertise_areas: ['Educação Infantil', 'Psicopedagogia', 'Gestão de Sala de Aula', 'Educação Inclusiva'],
    inclusive_tags: ['Mulheres', 'Educação Pública'],
    languages: ['Português'],
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    experience_years: 15,
    session_price_usd: 20
  },
  {
    email: 'roberto.oliveira.corredor.2024@menvo.com.br',
    first_name: 'Roberto',
    last_name: 'Silva Oliveira',
    bio: 'Corredor amador há 8 anos, completei 5 maratonas e dezenas de meias maratonas. Transformei minha vida através da corrida.',
    job_title: 'Corredor Amador e Coach',
    company: 'Assessoria Esportiva Vida Ativa',
    mentorship_topics: ['Corrida', 'Saúde', 'Bem-estar', 'Superação', 'Disciplina'],
    expertise_areas: ['Corrida de Rua', 'Preparação para Maratonas', 'Nutrição Esportiva', 'Motivação'],
    inclusive_tags: ['Esportes', 'Saúde'],
    languages: ['Português'],
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brasil',
    experience_years: 8,
    session_price_usd: 15
  },
  {
    email: 'juliana.rodrigues.costureira.2024@menvo.com.br',
    first_name: 'Juliana',
    last_name: 'Alves Rodrigues',
    bio: 'Costureira profissional há 20 anos, especializada em alta costura e ajustes. Transformei meu ateliê em um negócio próspero.',
    job_title: 'Costureira e Proprietária',
    company: 'Ateliê Juliana Alves',
    mentorship_topics: ['Costura', 'Moda', 'Empreendedorismo', 'Artesanato', 'Negócios Criativos'],
    expertise_areas: ['Alta Costura', 'Modelagem', 'Ajustes', 'Gestão de Ateliê'],
    inclusive_tags: ['Mulheres', 'Empreendedoras', 'Artesanato'],
    languages: ['Português'],
    city: 'Curitiba',
    state: 'PR',
    country: 'Brasil',
    experience_years: 20,
    session_price_usd: 12
  },
  {
    email: 'joao.martins.artesao.2024@menvo.com.br',
    first_name: 'João Pedro',
    last_name: 'Martins',
    bio: 'Artesão especializado em marcenaria e trabalhos em madeira. Ajudo artesãos a profissionalizarem seu trabalho.',
    job_title: 'Artesão e Marceneiro',
    company: 'Oficina JP Madeiras',
    mentorship_topics: ['Artesanato', 'Marcenaria', 'Empreendedorismo', 'Vendas Online', 'Criatividade'],
    expertise_areas: ['Marcenaria', 'Trabalho em Madeira', 'Design de Móveis', 'E-commerce'],
    inclusive_tags: ['Artesanato', 'Empreendedores'],
    languages: ['Português'],
    city: 'Porto Alegre',
    state: 'RS',
    country: 'Brasil',
    experience_years: 18,
    session_price_usd: 10
  },
  {
    email: 'antonio.pereira.pescador.2024@menvo.com.br',
    first_name: 'Antônio Carlos',
    last_name: 'Pereira',
    bio: 'Pescador artesanal há 25 anos. Luto pela preservação da pesca artesanal e ensino técnicas sustentáveis.',
    job_title: 'Pescador Artesanal',
    company: 'Colônia de Pescadores Z-10',
    mentorship_topics: ['Pesca Artesanal', 'Sustentabilidade', 'Tradições', 'Vida no Mar', 'Comunidade'],
    expertise_areas: ['Pesca Sustentável', 'Navegação', 'Preservação Marinha', 'Organização Comunitária'],
    inclusive_tags: ['Trabalhadores Tradicionais', 'Sustentabilidade'],
    languages: ['Português'],
    city: 'Salvador',
    state: 'BA',
    country: 'Brasil',
    experience_years: 25,
    session_price_usd: 8
  },
  {
    email: 'paulo.souza.taxista.2024@menvo.com.br',
    first_name: 'Paulo Henrique',
    last_name: 'Souza',
    bio: 'Motorista de táxi há 16 anos. Aprendi muito sobre relacionamento com clientes e gestão do próprio negócio.',
    job_title: 'Motorista de Táxi Autônomo',
    company: 'Cooperativa de Táxi Unidos',
    mentorship_topics: ['Trabalho Autônomo', 'Atendimento ao Cliente', 'Gestão Financeira', 'Empreendedorismo'],
    expertise_areas: ['Transporte Urbano', 'Relacionamento com Cliente', 'Gestão de Negócio Próprio', 'Cooperativismo'],
    inclusive_tags: ['Trabalhadores Autônomos', 'Empreendedores'],
    languages: ['Português'],
    city: 'Recife',
    state: 'PE',
    country: 'Brasil',
    experience_years: 16,
    session_price_usd: 10
  },
  {
    email: 'fernando.costa.caminhoneiro.2024@menvo.com.br',
    first_name: 'Fernando',
    last_name: 'Almeida Costa',
    bio: 'Caminhoneiro há 22 anos, rodei o Brasil inteiro. Oriento sobre carreira no transporte de cargas e segurança.',
    job_title: 'Motorista de Caminhão',
    company: 'Transportadora Rotas do Brasil',
    mentorship_topics: ['Transporte de Cargas', 'Vida na Estrada', 'Segurança', 'Logística', 'Resiliência'],
    expertise_areas: ['Direção Defensiva', 'Logística de Transporte', 'Manutenção de Veículos', 'Gestão de Tempo'],
    inclusive_tags: ['Trabalhadores do Transporte'],
    languages: ['Português'],
    city: 'Campinas',
    state: 'SP',
    country: 'Brasil',
    experience_years: 22,
    session_price_usd: 12
  },
  {
    email: 'patricia.silva.telemarketing.2024@menvo.com.br',
    first_name: 'Patrícia',
    last_name: 'Mendes Silva',
    bio: 'Operadora de telemarketing há 9 anos, me tornei supervisora. Ajudo profissionais de call center a crescerem.',
    job_title: 'Supervisora de Telemarketing',
    company: 'Contact Center Solutions',
    mentorship_topics: ['Telemarketing', 'Comunicação', 'Vendas', 'Gestão de Estresse', 'Carreira'],
    expertise_areas: ['Atendimento ao Cliente', 'Técnicas de Vendas', 'Gestão de Equipes', 'Comunicação Assertiva'],
    inclusive_tags: ['Mulheres', 'Atendimento'],
    languages: ['Português'],
    city: 'Fortaleza',
    state: 'CE',
    country: 'Brasil',
    experience_years: 9,
    session_price_usd: 15
  },
  {
    email: 'camila.santos.manicure.2024@menvo.com.br',
    first_name: 'Camila',
    last_name: 'Rodrigues Santos',
    bio: 'Manicure e nail designer há 11 anos. Transformei minha paixão por unhas em um negócio lucrativo.',
    job_title: 'Manicure e Nail Designer',
    company: 'Studio Camila Nails',
    mentorship_topics: ['Beleza', 'Nail Art', 'Empreendedorismo', 'Atendimento', 'Marketing Pessoal'],
    expertise_areas: ['Manicure', 'Nail Design', 'Gestão de Salão', 'Redes Sociais'],
    inclusive_tags: ['Mulheres', 'Empreendedoras', 'Beleza'],
    languages: ['Português'],
    city: 'Goiânia',
    state: 'GO',
    country: 'Brasil',
    experience_years: 11,
    session_price_usd: 10
  },
  {
    email: 'ricardo.lima.barbeiro.2024@menvo.com.br',
    first_name: 'Ricardo',
    last_name: 'Barbosa Lima',
    bio: 'Barbeiro profissional há 14 anos. Construí uma clientela fiel através de excelência no atendimento.',
    job_title: 'Barbeiro e Proprietário',
    company: 'Barbearia Clássica',
    mentorship_topics: ['Barbearia', 'Empreendedorismo', 'Atendimento', 'Técnicas de Corte', 'Gestão'],
    expertise_areas: ['Cortes Masculinos', 'Barba', 'Gestão de Barbearia', 'Fidelização de Clientes'],
    inclusive_tags: ['Empreendedores', 'Beleza'],
    languages: ['Português'],
    city: 'Manaus',
    state: 'AM',
    country: 'Brasil',
    experience_years: 14,
    session_price_usd: 12
  },
  {
    email: 'lucas.oliveira.bombeiro.2024@menvo.com.br',
    first_name: 'Lucas',
    last_name: 'Fernandes Oliveira',
    bio: 'Bombeiro civil há 10 anos. Sou instrutor de primeiros socorros e segurança do trabalho.',
    job_title: 'Bombeiro Civil',
    company: 'Corpo de Bombeiros Industrial',
    mentorship_topics: ['Segurança', 'Primeiros Socorros', 'Prevenção', 'Liderança', 'Trabalho em Equipe'],
    expertise_areas: ['Combate a Incêndio', 'Primeiros Socorros', 'Segurança do Trabalho', 'Resgate'],
    inclusive_tags: ['Segurança', 'Serviços Essenciais'],
    languages: ['Português'],
    city: 'Vitória',
    state: 'ES',
    country: 'Brasil',
    experience_years: 10,
    session_price_usd: 18
  },
  {
    email: 'jose.ribeiro.churros.2024@menvo.com.br',
    first_name: 'José Carlos',
    last_name: 'Ribeiro',
    bio: 'Vendedor de churros há 13 anos, comecei com um carrinho e hoje tenho 3 pontos de venda.',
    job_title: 'Empreendedor - Food Service',
    company: 'Churros do Zé',
    mentorship_topics: ['Empreendedorismo', 'Food Service', 'Vendas', 'Atendimento', 'Gestão Financeira'],
    expertise_areas: ['Comércio de Rua', 'Gestão de Negócio Próprio', 'Atendimento ao Cliente', 'Expansão de Negócios'],
    inclusive_tags: ['Empreendedores', 'Comércio'],
    languages: ['Português'],
    city: 'Florianópolis',
    state: 'SC',
    country: 'Brasil',
    experience_years: 13,
    session_price_usd: 10
  }
]

async function insertMentor(mentorData) {
  const { email, first_name, last_name, ...profileData } = mentorData
  
  try {
    console.log(`\n📝 Processando: ${first_name} ${last_name}...`)
    
    // 1. Criar usuário de autenticação
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`   ⚠️  Email já existe, atualizando perfil...`)
        
        // Buscar usuário existente
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === email)
        
        if (!existingUser) {
          console.log(`   ❌ Usuário não encontrado`)
          return { success: false, reason: 'user_not_found' }
        }
        
        // Atualizar perfil existente
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name,
            last_name,
            ...profileData,
            availability_status: 'busy'
          })
          .eq('id', existingUser.id)
        
        if (updateError) {
          console.log(`   ❌ Erro ao atualizar: ${updateError.message}`)
          return { success: false, reason: updateError.message }
        }
        
        // Adicionar role de mentor
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            role_id: 1 // mentor role
          })
        
        if (roleError && !roleError.message.includes('duplicate')) {
          console.log(`   ⚠️  Role: ${roleError.message}`)
        }
        
        console.log(`   ✅ Perfil atualizado`)
        return { success: true, userId: existingUser.id, updated: true }
      }
      throw authError
    }

    const userId = authData.user.id
    console.log(`   ✅ Usuário criado (ID: ${userId})`)

    // 2. Atualizar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        ...profileData,
        availability_status: 'busy'
      })
      .eq('id', userId)

    if (profileError) {
      console.log(`   ❌ Erro ao atualizar perfil: ${profileError.message}`)
      return { success: false, reason: profileError.message }
    }
    
    console.log(`   ✅ Perfil atualizado`)

    // 3. Adicionar role de mentor
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: 1 // mentor role (id=1 conforme migration)
      })

    if (roleError) {
      console.log(`   ⚠️  Role: ${roleError.message}`)
    } else {
      console.log(`   ✅ Role de mentor adicionada`)
    }

    console.log(`✅ ${first_name} ${last_name} criado com sucesso!`)
    return { success: true, userId, created: true }

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`)
    return { success: false, reason: error.message }
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🌱 INSERINDO MENTORES DIVERSOS - VERSÃO FINAL')
  console.log('='.repeat(60))
  console.log(`\n📊 Total: ${diverseMentors.length} mentores`)
  console.log('⚠️  Fotos serão adicionadas manualmente depois\n')

  let created = 0
  let updated = 0
  let errors = 0

  for (const mentor of diverseMentors) {
    const result = await insertMentor(mentor)
    
    if (result.success) {
      if (result.created) created++
      if (result.updated) updated++
    } else {
      errors++
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60))
  console.log(`✅ Criados: ${created}`)
  console.log(`🔄 Atualizados: ${updated}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`📈 Total: ${diverseMentors.length}`)
  console.log('='.repeat(60))
  console.log('\n📸 Adicione fotos em: https://randomuser.me/photos\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
