
import axios from 'axios';

/**
 * Groq AI Service
 * Responsável pelo match inteligente de mentores e geração de justificativas.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface AIMatchResult {
  suggestions: Array<{
    mentor_id: string;
    reason: string;
  }>;
  global_justification: string;
  suggested_topics: string[];
  no_match: boolean;
}

export const groqService = {
  async findOptimalMentors(userQuery: string, mentorsContext: any[]): Promise<AIMatchResult> {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada no ambiente.');
    }

    const mentorsSummary = mentorsContext.map(m => ({
      id: m.id,
      name: m.full_name,
      title: m.job_title,
      skills: m.mentor_skills,
      bio: m.bio?.substring(0, 150)
    }));

    const prompt = `
      Você é o Especialista em Conexões da plataforma MENVO. 
      Sua missão é sugerir os 3 mentores mais adequados da lista abaixo para a dúvida: "${userQuery}"

      MENTORES: ${JSON.stringify(mentorsSummary)}

      REGRAS:
      1. Se não houver match direto (ex: o usuário quer algo que ninguém faz), sugira mentores de "RH", "Carreira" ou "Psicologia" como suporte geral.
      2. Para CADA mentor sugerido, crie uma justificativa CURTA e PERSONALIZADA (reason).
      3. Se for um caso de fallback (sem match direto), defina no_match como true mas AINDA ASSIM sugira mentores de carreira.

      FORMATO JSON:
      {
        "suggestions": [
          { "mentor_id": "uuid", "reason": "Ele é especialista em X..." }
        ],
        "global_justification": "Frase curta de efeito sobre a busca.",
        "suggested_topics": ["tema1", "tema2"],
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
