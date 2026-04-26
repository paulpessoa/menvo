
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
      Você é o Especialista em Conexões Ético da plataforma MENVO. 
      Sua missão é sugerir mentores da lista abaixo para a dúvida: "${userQuery}"

      MENTORES DISPONÍVEIS: ${JSON.stringify(mentorsSummary)}

      REGRAS CRÍTICAS DE INTEGRIDADE:
      1. RIGOR TÉCNICO: Se o usuário quer algo que NÃO EXISTE na lista de mentores (ex: "jogador de futebol", "astronauta", "médico") e não há mentores com essa expertise REAL, retorne "no_match": true.
      2. NUNCA FORÇAR: Não sugira profissões não correlacionadas (ex: NÃO sugira um chaveiro para alguém que quer ser esportista). É melhor não sugerir ninguém do que sugerir algo ridículo.
      3. JUSTIFICATIVA HONESTA: Se "no_match" for true, na "global_justification", explique educadamente que a rede Menvo ainda não possui especialistas nessa área específica, mas que estamos em busca ativa por esses perfis.
      4. CORE BUSINESS: Foque em Carreira, Tecnologia, Design, Negócios e Educação. Se o match for parcial (ex: quer ser vendedor e temos mentor de vendas), retorne "no_match": false e sugira.

      FORMATO JSON OBRIGATÓRIO:
      {
        "suggestions": [
          { "mentor_id": "uuid", "reason": "Justificativa curta baseada em dados REAIS do mentor." }
        ],
        "global_justification": "Frase sobre o resultado da busca.",
        "suggested_topics": ["temas", "relevantes"],
        "no_match": boolean
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
