import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuizResponse {
  id: string
  name: string
  email: string
  career_moment: string
  mentorship_experience: string
  development_areas: string[]
  current_challenge: string
  future_vision: string
  share_knowledge: string
  personal_life_help: string
}

interface Mentor {
  id: string
  full_name: string
  bio: string
  current_position: string
  current_company: string
  expertise_areas: string[]
  mentor_skills: string[]
  mentorship_topics: string[]
  inclusive_tags: string[]
  inclusion_tags: string[]
  availability_status: string
  is_available: boolean
  rating: number
  reviews: number
  sessions: number
}

interface AnalysisResult {
  titulo_personalizado: string
  resumo_motivador: string
  mentores_sugeridos: Array<{
    tipo: string
    razao: string
    disponivel: boolean
    mentor_nome?: string
  }>
  conselhos_praticos: string[]
  proximos_passos: string[]
  areas_desenvolvimento: string[]
  mensagem_final: string
  potencial_mentor: boolean
  areas_vida_pessoal: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { responseId } = await req.json()

    if (!responseId) {
      return new Response(
        JSON.stringify({ error: 'Response ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get quiz response
    const { data: quizResponse, error: responseError } = await supabaseClient
      .from('quiz_responses')
      .select('*')
      .eq('id', responseId)
      .single()

    if (responseError || !quizResponse) {
      return new Response(
        JSON.stringify({ error: 'Quiz response not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get available mentors from mentors_view
    const { data: mentors, error: mentorsError } = await supabaseClient
      .from('mentors_view')
      .select(`
        id, full_name, bio, current_position, current_company,
        expertise_areas, mentor_skills, mentorship_topics,
        inclusive_tags, inclusion_tags, availability_status,
        is_available, rating, reviews, sessions
      `)
      .eq('is_available', true)

    const availableMentors = mentors || []

    // Generate analysis with OpenAI
    let analysisResult: AnalysisResult
    let usedFallback = false

    try {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const prompt = generateAnalysisPrompt(quizResponse, availableMentors)

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em desenvolvimento de carreira e mentoria. Forneça análises objetivas, motivadoras e construtivas em português brasileiro. Sempre retorne JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.text()
        console.error('OpenAI API error:', errorData)
        throw new Error('OpenAI API request failed')
      }

      const openaiData = await openaiResponse.json()
      const content = openaiData.choices[0].message.content
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not extract JSON from OpenAI response')
      }

    } catch (openaiError) {
      console.error('Error using OpenAI, using fallback:', openaiError)
      usedFallback = true
      analysisResult = generateFallbackAnalysis(quizResponse, availableMentors)
    }

    // Update quiz response with analysis
    const { error: updateError } = await supabaseClient
      .from('quiz_responses')
      .update({
        ai_analysis: analysisResult,
        processed_at: new Date().toISOString()
      })
      .eq('id', responseId)

    if (updateError) {
      console.error('Error updating quiz response:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Email with analysis removed - user can request it from results page

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        usedFallback,
        responseId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('General error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateAnalysisPrompt(response: QuizResponse, mentors: Mentor[]): string {
  return `Analise as respostas do questionário abaixo e crie uma análise personalizada, criativa e motivadora.

RESPOSTAS DO PARTICIPANTE:
- Nome: ${response.name}
- Momento de carreira: ${response.career_moment}
- Experiência com mentoria: ${response.mentorship_experience}
- Áreas de desenvolvimento: ${response.development_areas.join(', ')}
- Desafio profissional: ${response.current_challenge}
- Visão de futuro (2 anos): ${response.future_vision}
- Interesse em compartilhar conhecimento: ${response.share_knowledge}
- Desafios na vida pessoal: ${response.personal_life_help}

MENTORES DISPONÍVEIS NA PLATAFORMA:
${mentors.map(m => `- ${m.full_name} (${m.current_position} na ${m.current_company}): 
  Expertise: ${m.expertise_areas?.join(', ') || 'N/A'}
  Tópicos de Mentoria: ${m.mentorship_topics?.join(', ') || 'N/A'}
  Rating: ${m.rating}/5 (${m.reviews} avaliações, ${m.sessions} sessões)
  Status: ${m.availability_status}`).join('\n\n')}

INSTRUÇÕES:
1. Crie uma análise calorosa, profissional e motivadora
2. Sugira 2-3 tipos de mentores baseados nas áreas de interesse
   - Se houver mentores disponíveis que combinam, mencione-os especificamente
   - Se não houver mentores para certas áreas, indique disponivel: false
3. Dê 2-3 conselhos práticos e acionáveis
4. Identifique se a pessoa tem potencial para ser mentora (baseado na resposta sobre compartilhar conhecimento)
5. Sugira áreas de desenvolvimento na vida pessoal baseado nos desafios mencionados

FORMATO DE RESPOSTA (JSON válido):
{
  "titulo_personalizado": "Seu Perfil de Crescimento",
  "resumo_motivador": "Mensagem inspiradora de 2-3 linhas",
  "mentores_sugeridos": [
    {
      "tipo": "Mentor em Tecnologia",
      "razao": "Por que este mentor seria ideal",
      "disponivel": true,
      "mentor_nome": "Nome do mentor real"
    }
  ],
  "conselhos_praticos": [
    "Conselho específico 1",
    "Conselho específico 2"
  ],
  "proximos_passos": [
    "Ação concreta 1",
    "Ação concreta 2"
  ],
  "areas_desenvolvimento": ["área 1", "área 2"],
  "mensagem_final": "Mensagem encorajadora",
  "potencial_mentor": true,
  "areas_vida_pessoal": ["área pessoal 1", "área pessoal 2"]
}`
}

function generateFallbackAnalysis(response: QuizResponse, mentors: Mentor[]): AnalysisResult {
  
  // Match mentors with development areas using expertise_areas and mentorship_topics
  const matchedMentors = mentors.filter(mentor => {
    const mentorAreas = [
      ...(mentor.expertise_areas || []),
      ...(mentor.mentorship_topics || []),
      ...(mentor.mentor_skills || [])
    ].map(area => area.toLowerCase())
    
    return response.development_areas.some(devArea => 
      mentorAreas.some(mentorArea => 
        mentorArea.includes(devArea.toLowerCase()) || 
        devArea.toLowerCase().includes(mentorArea)
      )
    )
  }).slice(0, 3)

  // Use real mentors if available, otherwise show generic unavailable mentors
  const mentoresSugeridos = matchedMentors.length > 0
    ? matchedMentors.map(mentor => ({
        tipo: `${mentor.full_name} - ${mentor.current_position}`,
        razao: `${mentor.bio?.substring(0, 100)}... | Expertise: ${mentor.expertise_areas?.slice(0, 2).join(', ')} | Rating: ${mentor.rating}/5`,
        disponivel: mentor.availability_status === 'available',
        mentor_nome: mentor.full_name
      }))
    : [
        {
          tipo: "Mentor de Carreira",
          razao: "Para te ajudar a planejar seus próximos passos profissionais e definir objetivos claros",
          disponivel: false
        },
        {
          tipo: "Mentor de Desenvolvimento Técnico", 
          razao: "Para desenvolver suas habilidades técnicas e se manter atualizado no mercado",
          disponivel: false
        },
        {
          tipo: "Mentor de Liderança",
          razao: "Para desenvolver suas soft skills e capacidades de liderança",
          disponivel: false
        }
      ]

  const potencialMentor = response.share_knowledge.includes('sim') || 
                          response.share_knowledge.includes('ja-faco')

  return {
    titulo_personalizado: "Seu Perfil de Crescimento Profissional",
    resumo_motivador: "Você demonstra clareza sobre seus objetivos e está no caminho certo para alcançá-los. Continue investindo em seu desenvolvimento!",
    mentores_sugeridos: mentoresSugeridos,
    conselhos_praticos: [
      "Defina metas específicas e mensuráveis para os próximos 3 meses",
      "Busque networking ativo na sua área de interesse",
      "Invista em aprendizado contínuo através de cursos e mentorias"
    ],
    proximos_passos: [
      "Cadastre-se na plataforma MENVO para conectar com mentores",
      "Identifique 3 habilidades prioritárias para desenvolver",
      "Participe de comunidades e eventos da sua área"
    ],
    areas_desenvolvimento: response.development_areas.slice(0, 3),
    mensagem_final: "Você tem um grande potencial! Continue buscando crescimento e não hesite em pedir ajuda quando precisar.",
    potencial_mentor: potencialMentor,
    areas_vida_pessoal: ["Equilíbrio vida-trabalho", "Desenvolvimento de hobbies"]
  }
}
