
import axios from 'axios';

/**
 * Groq AI Service
 * Responsável pelo match inteligente de mentores e geração de justificativas.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface AIMatchResult {
  mentor_ids: string[];
  justification: string;
  suggested_topics: string[];
  no_match: boolean;
}

export const groqService = {
  /**
   * Realiza o match entre a dúvida do usuário e a base de mentores
   */
  async findOptimalMentors(userQuery: string, mentorsContext: any[]): Promise<AIMatchResult> {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada no ambiente.');
    }

    // Criar um resumo compacto dos mentores para o contexto da IA
    const mentorsSummary = mentorsContext.map(m => ({
      id: m.id,
      name: m.full_name,
      title: m.job_title,
      skills: m.mentor_skills,
      bio: m.bio?.substring(0, 150)
    }));

    const prompt = `
      Você é o Matchmaker da plataforma MENVO (Mentores Voluntários).
      Seu objetivo é analisar a dúvida do usuário e sugerir os 3 mentores mais adequados da lista abaixo.

      DÚVIDA DO USUÁRIO: "${userQuery}"

      LISTA DE MENTORES DISPONÍVEIS:
      ${JSON.stringify(mentorsSummary)}

      REGRAS DE RESPOSTA:
      1. Retorne APENAS um JSON válido.
      2. Se encontrar mentores, defina no_match como false e liste os IDs em order de relevância.
      3. Se NÃO encontrar ninguém minimamente relevante, defina no_match como true.
      4. A justificativa deve ser curta, motivadora e em Português Brasileiro.
      5. Sugira 3 tópicos (keywords) que o usuário deveria procurar.

      FORMATO DO JSON:
      {
        "mentor_ids": ["uuid1", "uuid2"],
        "justification": "Sugiro o Mentor X porque...",
        "suggested_topics": ["vendas", "carreira", "tech"],
        "no_match": false
      }
    `;

    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Você é um assistente técnico que retorna apenas JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return result as AIMatchResult;
      
    } catch (error: any) {
      console.error('❌ Erro na chamada ao Groq:', error.response?.data || error.message);
      throw new Error('Falha ao processar sugestão de IA.');
    }
  }
};
