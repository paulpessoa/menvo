
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
      Você é o Especialista em Conexões da plataforma MENVO. 
      Sua missão é ler a dúvida de um usuário e encontrar o "par perfeito" entre nossos mentores voluntários.

      DÚVIDA/DESAFIO DO USUÁRIO: "${userQuery}"
      
      CONTEXTO DOS MENTORES DISPONÍVEIS (JSON):
      ${JSON.stringify(mentorsSummary)}

      REGRAS DE OURO:
      1. NÃO seja literal. Se o usuário quer "ajuda com código", pense em mentores de "Software", "Engenharia" ou "Desenvolvimento".
      2. IMPORTANTE: O nome do mentor (field 'name') muitas vezes contém a sua profissão ou especialidade (ex: "Fulano Chaveiro"). Use isso para o match!
      3. Se o usuário quer estudar "Jornalismo", e você vir alguém de "Comunicação Social", isso é um match perfeito!
      4. Retorne no máximo 3 mentores.
      5. A JUSTIFICATIVA deve ser humana: "Sugiro o Mentor X porque ele tem experiência em Y, que é exatamente o que você precisa para resolver Z".
      5. Se houver QUALQUER mentor minimamente relacionado, defina no_match como false.

      FORMATO OBRIGATÓRIO DE RESPOSTA (JSON):
      {
        "mentor_ids": ["uuid1", "uuid2"],
        "justification": "Baseado no seu desafio, estes mentores são ideais por causa de...",
        "suggested_topics": ["tema1", "tema2", "tema3"],
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
