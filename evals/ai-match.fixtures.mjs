// Synthetic mentor pool for evals/ai-match.eval.mjs — NOT real user data.
// Spans every category the match prompt is told to prioritize (Carreira,
// Tecnologia, Programação, Produto, Design, Dados, Gestão, Educação) plus a
// couple outside it, so "no_match" cases have something plausible-but-wrong
// to resist matching against.

export const mentors = [
  {
    id: "m-backend-01",
    full_name: "Carla Mendes",
    job_title: "Engenheira de Software Backend",
    mentor_skills: ["Node.js", "PostgreSQL", "arquitetura de APIs", "microsserviços"],
    bio: "10 anos construindo sistemas distribuídos em fintechs. Ajudo devs a migrar de monólito pra microsserviços e a se preparar para entrevistas de backend sênior."
  },
  {
    id: "m-frontend-01",
    full_name: "Bruno Alves",
    job_title: "Frontend Engineer",
    mentor_skills: ["React", "TypeScript", "acessibilidade", "performance web"],
    bio: "Foco em React e Core Web Vitals. Já mentorei mais de 30 pessoas migrando de bootcamp pra primeiro emprego como frontend."
  },
  {
    id: "m-data-01",
    full_name: "Renata Souza",
    job_title: "Cientista de Dados",
    mentor_skills: ["Python", "machine learning", "SQL", "estatística"],
    bio: "Trabalho com modelos de recomendação em e-commerce. Ajudo quem quer migrar de analista pra cientista de dados."
  },
  {
    id: "m-product-01",
    full_name: "Felipe Costa",
    job_title: "Product Manager",
    mentor_skills: ["discovery", "priorização", "métricas de produto", "roadmap"],
    bio: "PM há 8 anos em startups B2B. Ajudo devs e designers que querem migrar pra produto a entenderem o dia a dia do papel."
  },
  {
    id: "m-design-01",
    full_name: "Juliana Ferreira",
    job_title: "UX/UI Designer",
    mentor_skills: ["Figma", "pesquisa com usuário", "design system", "prototipagem"],
    bio: "Lidero o design system de um banco digital. Ajudo designers juniores a montar portfólio e passar em processos seletivos."
  },
  {
    id: "m-leadership-01",
    full_name: "Marcos Ribeiro",
    job_title: "Engineering Manager",
    mentor_skills: ["liderança técnica", "gestão de pessoas", "1:1s", "feedback"],
    bio: "Gerencio um time de 12 engenheiros. Ajudo devs seniores que estão migrando pra liderança pela primeira vez."
  },
  {
    id: "m-career-01",
    full_name: "Patrícia Lima",
    job_title: "Coach de Carreira em Tecnologia",
    mentor_skills: ["transição de carreira", "entrevistas", "negociação salarial", "LinkedIn"],
    bio: "Ajudo profissionais de outras áreas a migrarem pra tecnologia — do primeiro currículo até a proposta de emprego."
  },
  {
    id: "m-education-01",
    full_name: "André Santos",
    job_title: "Professor e Educador em Tecnologia",
    mentor_skills: ["didática", "criação de conteúdo técnico", "mentoria de iniciantes"],
    bio: "Dou aulas de programação para iniciantes há 6 anos. Foco em ajudar quem está começando do zero a não desistir nos primeiros meses."
  },
  {
    id: "m-marketing-01",
    full_name: "Camila Rocha",
    job_title: "Growth Marketing Manager",
    mentor_skills: ["aquisição de usuários", "SEO", "growth hacking", "analytics"],
    bio: "Lidero growth em uma scale-up. Ajudo pessoas de marketing tradicional a migrarem pra growth/performance."
  },
  {
    id: "m-finance-01",
    full_name: "Diego Martins",
    job_title: "Analista Financeiro Sênior",
    mentor_skills: ["modelagem financeira", "Excel avançado", "FP&A"],
    bio: "Trabalho com planejamento financeiro corporativo. Ajudo quem quer entrar ou crescer na área financeira de empresas de tecnologia."
  },
  {
    id: "m-mobile-01",
    full_name: "Larissa Pinto",
    job_title: "Engenheira Mobile",
    mentor_skills: ["Kotlin", "Swift", "React Native", "publicação em lojas de app"],
    bio: "Desenvolvo apps mobile há 7 anos, hoje em uma fintech. Ajudo devs web que querem migrar para mobile."
  },
  {
    id: "m-devops-01",
    full_name: "Rafael Nogueira",
    job_title: "Engenheiro DevOps/SRE",
    mentor_skills: ["Kubernetes", "AWS", "CI/CD", "observabilidade"],
    bio: "Cuido de infraestrutura em produção de alta escala. Ajudo devs que querem migrar pra DevOps/SRE."
  }
]
