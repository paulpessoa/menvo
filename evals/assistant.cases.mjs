export const testCases = [
  {
    input: "Oi, tudo bem?",
    expectedTool: null,
    expectedResponsePattern: /.*(ajud|olá|como|posso).*/i
  },
  {
    input: "Como a Menvo funciona?",
    expectedTool: "explainHowItWorks",
    expectedResponsePattern: /.*(gratuita|1-a-1|plataforma|mentor).*/i
  },
  {
    input: "Quero um mentor de dados",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(dados|encontrei|mentor|busquei).*/i
  },
  {
    input: "Tem alguém que sabe react?",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(react|frontend|mentor).*/i
  },
  {
    input: "Quais os horários do mentor john-doe?",
    expectedTool: "getMentorAvailability",
    expectedResponsePattern: /.*(horários|agenda|disponível).*/i
  },
  {
    input: "Eu sou uma ONG, como participo?",
    expectedTool: "explainHowItWorks",
    expectedResponsePattern: /.*(ONGs|parceiras|organizações).*/i
  },
  {
    input: "Preciso pagar para usar?",
    expectedTool: "explainHowItWorks",
    expectedResponsePattern: /.*(gratuito|100%|voluntário).*/i
  },
  {
    input: "Gostaria de ajuda para transição de carreira.",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(transição|carreira|mentor).*/i
  },
  {
    input: "A Menvo tem mentores de design e UX?",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(design|ux|encontrei).*/i
  },
  {
    input: "Qual a agenda do jorge-silva?",
    expectedTool: "getMentorAvailability",
    expectedResponsePattern: /.*(jorge|agenda|horário).*/i
  },
  {
    input: "Como posso me tornar mentor?",
    expectedTool: "explainHowItWorks",
    expectedResponsePattern: /.*(voluntário|conhecimento|mentor).*/i
  },
  {
    input: "Quais são as regras da plataforma?",
    expectedTool: "explainHowItWorks",
    expectedResponsePattern: /.*(gratuita|1-a-1|menvo).*/i
  },
  {
    input: "Você pode me sugerir alguém bom de Python?",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(python|backend|mentor).*/i
  },
  {
    input: "O mentor maria-clara tem vaga na sexta?",
    expectedTool: "getMentorAvailability",
    expectedResponsePattern: /.*(maria-clara|agenda|vaga).*/i
  },
  {
    input: "Tchau, obrigado!",
    expectedTool: null,
    expectedResponsePattern: /.*(disposição|tchau|até logo).*/i
  },
  {
    input: "Gostaria de aprender mais sobre educação infantil",
    expectedTool: null,
    expectedResponsePattern: /.*(carreira|mentoria|não posso).*/i
  },
  {
    input: "Gostaria de abrir meu próprio negócio",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(negócio|empreendedor|encontrei).*/i
  },
  {
    input: "Quero aprender a investir",
    expectedTool: "searchMentors",
    expectedResponsePattern: /.*(finanças|investi).*/i
  },
  {
    input: "Nota 5, vocês são incríveis!",
    expectedTool: "saveFeedback",
    expectedResponsePattern: /.*(obrigado|agradeço|feedback).*/i
  }
]
