/**
 * @jest-environment node
 */
import {
  sanitizeAnalysisMentors,
  fallbackAnalysis,
  type AnalysisMentor,
  type QuizAnswers,
  type QuizAnalysisResult
} from "./analyze"

describe("sanitizeAnalysisMentors", () => {
  const realMentors: AnalysisMentor[] = [
    {
      id: "m-1",
      full_name: "Kleber Castro",
      bio: "Especialista em liderança",
      job_title: "Tech Lead",
      company: "Acme",
      expertise_areas: ["Liderança", "Carreira"],
      mentor_skills: ["Gestão", "1:1"],
      mentorship_topics: ["Carreira"],
      availability_status: "available",
      average_rating: 5,
      total_reviews: 10,
      total_sessions: 25
    },
    {
      id: "m-2",
      full_name: "Ismaela Silva",
      bio: "Coach de carreira",
      job_title: "HR Director",
      company: "Beta Corp",
      expertise_areas: ["Comunicação", "RH"],
      mentor_skills: ["Networking"],
      mentorship_topics: ["Comunicação"],
      availability_status: "busy",
      average_rating: 4.8,
      total_reviews: 8,
      total_sessions: 15
    }
  ]

  it("purges hallucinated mentor names and sets disponivel to false", () => {
    const rawAnalysis: QuizAnalysisResult = {
      precisa_refazer: false,
      titulo_personalizado: "Seu Perfil",
      resumo_motivador: "Texto motivador",
      mentores_sugeridos: [
        {
          tipo: "Mentor em Comunicação",
          razao: "Ajuda com networking",
          disponivel: true,
          mentor_nome: "Ana Santos" // Hallucinated!
        },
        {
          tipo: "Mentor em Carreira",
          razao: "Ajuda com metas",
          disponivel: true,
          mentor_nome: "Pedro Oliveira" // Hallucinated!
        }
      ],
      conselhos_praticos: ["Conselho 1"],
      proximos_passos: ["Passo 1"],
      areas_desenvolvimento: ["Liderança"],
      mensagem_final: "Boa sorte!",
      potencial_mentor: false,
      areas_vida_pessoal: []
    }

    const sanitized = sanitizeAnalysisMentors(rawAnalysis, realMentors)

    expect(sanitized.mentores_sugeridos[0].mentor_nome).toBe("")
    expect(sanitized.mentores_sugeridos[0].disponivel).toBe(false)
    expect(sanitized.mentores_sugeridos[1].mentor_nome).toBe("")
    expect(sanitized.mentores_sugeridos[1].disponivel).toBe(false)
  })

  it("keeps real mentors and sets disponivel according to availability_status", () => {
    const rawAnalysis: QuizAnalysisResult = {
      precisa_refazer: false,
      titulo_personalizado: "Seu Perfil",
      resumo_motivador: "Texto motivador",
      mentores_sugeridos: [
        {
          tipo: "Mentor em Liderança",
          razao: "Ajuda com time",
          disponivel: true,
          mentor_nome: "Kleber Castro"
        },
        {
          tipo: "Mentora em RH",
          razao: "Ajuda com comunicação",
          disponivel: true, // Model guessed true, but Ismaela is busy
          mentor_nome: "Ismaela Silva"
        }
      ],
      conselhos_praticos: ["Conselho 1"],
      proximos_passos: ["Passo 1"],
      areas_desenvolvimento: ["Liderança"],
      mensagem_final: "Boa sorte!",
      potencial_mentor: false,
      areas_vida_pessoal: []
    }

    const sanitized = sanitizeAnalysisMentors(rawAnalysis, realMentors)

    // Kleber Castro is available
    expect(sanitized.mentores_sugeridos[0].mentor_nome).toBe("Kleber Castro")
    expect(sanitized.mentores_sugeridos[0].disponivel).toBe(true)

    // Ismaela Silva is busy -> disponivel should be false
    expect(sanitized.mentores_sugeridos[1].mentor_nome).toBe("Ismaela Silva")
    expect(sanitized.mentores_sugeridos[1].disponivel).toBe(false)
  })

  it("handles empty or whitespace mentor_nome gracefully", () => {
    const rawAnalysis: QuizAnalysisResult = {
      precisa_refazer: false,
      titulo_personalizado: "Seu Perfil",
      resumo_motivador: "Texto motivador",
      mentores_sugeridos: [
        {
          tipo: "Mentor Geral",
          razao: "Ajuda com carreira",
          disponivel: true,
          mentor_nome: ""
        }
      ],
      conselhos_praticos: ["Conselho 1"],
      proximos_passos: ["Passo 1"],
      areas_desenvolvimento: ["Liderança"],
      mensagem_final: "Boa sorte!",
      potencial_mentor: false,
      areas_vida_pessoal: []
    }

    const sanitized = sanitizeAnalysisMentors(rawAnalysis, realMentors)
    expect(sanitized.mentores_sugeridos[0].mentor_nome).toBe("")
    expect(sanitized.mentores_sugeridos[0].disponivel).toBe(false)
  })
})

describe("fallbackAnalysis", () => {
  const sampleAnswers: QuizAnswers = {
    name: "Adryel Silva",
    career_moment: "Início de carreira",
    mentorship_experience: "Nunca participei",
    development_areas: ["Liderança", "Comunicação"],
    current_challenge: "Gostaria de crescer profissionalmente e aprender a liderar equipes.",
    future_vision: "Estar trabalhando como desenvolvedor pleno em uma grande empresa de tecnologia.",
    share_knowledge: "sim, gostaria",
    personal_life_help: "Equilibrar estudos com tempo para família e lazer com qualidade."
  }

  it("generates valid fallback analysis with available mentors", () => {
    const mentors: AnalysisMentor[] = [
      {
        id: "m-1",
        full_name: "Kleber Castro",
        bio: "Líder técnico",
        job_title: "Tech Lead",
        company: "Acme",
        expertise_areas: ["Liderança"],
        mentor_skills: ["Gestão"],
        mentorship_topics: ["Liderança"],
        availability_status: "available",
        average_rating: 5,
        total_reviews: 10,
        total_sessions: 25
      }
    ]

    const result = fallbackAnalysis(sampleAnswers, mentors)
    expect(result.precisa_refazer).toBe(false)
    expect(result.mentores_sugeridos.length).toBeGreaterThan(0)
    expect(result.mentores_sugeridos[0].mentor_nome).toBe("Kleber Castro")
    expect(result.mentores_sugeridos[0].disponivel).toBe(true)
  })

  it("generates valid generic fallback when mentor list is empty", () => {
    const result = fallbackAnalysis(sampleAnswers, [])
    expect(result.precisa_refazer).toBe(false)
    expect(result.mentores_sugeridos.length).toBe(3)
    expect(result.mentores_sugeridos.every((m) => m.mentor_nome === "" && m.disponivel === false)).toBe(true)
  })

  it("does not trigger precisa_refazer when optional personal_life_help is skipped", () => {
    const answersWithoutPersonalHelp: QuizAnswers = {
      ...sampleAnswers,
      personal_life_help: ""
    }
    const result = fallbackAnalysis(answersWithoutPersonalHelp, [])
    expect(result.precisa_refazer).toBe(false)
  })

  it("triggers precisa_refazer when challenge or vision is genuinely vague or short", () => {
    const vagueAnswers: QuizAnswers = {
      ...sampleAnswers,
      current_challenge: "teste",
      future_vision: "não sei"
    }
    const result = fallbackAnalysis(vagueAnswers, [])
    expect(result.precisa_refazer).toBe(true)
    expect(result.titulo_personalizado).toBe("Que tal tentar novamente?")
  })
})
