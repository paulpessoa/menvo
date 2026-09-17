// 20 cases for evals/ai-match.eval.ts. `expectMentorIds` = pass if at least
// one of these ids appears in result.suggestions. `expectNoMatch: true` =
// pass if result.no_match === true (regardless of suggestions content).
export const cases = [
  { query: "quero aprender React e trabalhar como frontend", expectMentorIds: ["m-frontend-01"] },
  { query: "como migrar de analista de dados pra cientista de dados", expectMentorIds: ["m-data-01"] },
  { query: "quero entender o dia a dia de um product manager", expectMentorIds: ["m-product-01"] },
  { query: "preciso de ajuda pra montar meu portfólio de design", expectMentorIds: ["m-design-01"] },
  { query: "estou virando líder técnico pela primeira vez, tô perdido", expectMentorIds: ["m-leadership-01"] },
  { query: "quero migrar de outra área pra tecnologia, não sei por onde começar", expectMentorIds: ["m-career-01"] },
  { query: "sou professor e quero ensinar programação melhor pros meus alunos", expectMentorIds: ["m-education-01"] },
  { query: "quero crescer em growth marketing e aquisição de usuários", expectMentorIds: ["m-marketing-01"] },
  { query: "quero entender modelagem financeira e trabalhar com FP&A", expectMentorIds: ["m-finance-01"] },
  { query: "quero migrar de frontend web pra desenvolvimento mobile", expectMentorIds: ["m-mobile-01"] },
  { query: "quero aprender Kubernetes e trabalhar com infraestrutura", expectMentorIds: ["m-devops-01"] },
  { query: "como construir uma API backend escalável em Node.js", expectMentorIds: ["m-backend-01"] },
  { query: "quero virar astronauta, como faço pra entrar nesse mercado?", expectNoMatch: true },
  { query: "preciso de um médico pra tratar minha ansiedade", expectNoMatch: true },
  { query: "quero virar jogador de futebol profissional", expectNoMatch: true },
  { query: "preciso de aconselhamento jurídico pra abrir uma empresa", expectNoMatch: true },
  { query: "quero aprender a cantar e me profissionalizar em música", expectNoMatch: true },
  { query: "como faço pra negociar salário na hora de trocar de emprego", expectMentorIds: ["m-career-01"] },
  { query: "quero entender como fazer 1:1 melhores com meu time", expectMentorIds: ["m-leadership-01"] },
  { query: "quero aprender SQL e estatística pra virar analista de dados", expectMentorIds: ["m-data-01"] }
]
