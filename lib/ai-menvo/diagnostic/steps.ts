import type { ChipOption } from "@/lib/ai/protocol"
import type { DiagnosticStepId } from "./types"

export interface DiagnosticStepDefinition {
  id: DiagnosticStepId
  name: string
  questionText: string
  descriptionText?: string
  inputType: "single_choice" | "multi_choice" | "text_or_voice"
  chipOptions?: ChipOption[]
  allowOther?: boolean
  canSkip?: boolean
  placeholder?: string
  minChars?: number
}

export const DIAGNOSTIC_STEPS: Record<DiagnosticStepId, DiagnosticStepDefinition> = {
  1: {
    id: 1,
    name: "Momento de carreira",
    questionText: "Qual é o seu momento atual de carreira?",
    descriptionText: "Escolha a opção que melhor descreve onde você está hoje.",
    inputType: "single_choice",
    allowOther: true,
    chipOptions: [
      { value: "ensino-medio", label: "Ensino Médio" },
      { value: "estudante-universitario", label: "Estudante Universitário" },
      { value: "recem-formado", label: "Recém-formado" },
      { value: "profissional-junior", label: "Profissional Júnior" },
      { value: "transicao", label: "Transição de Carreira" },
      { value: "outro", label: "Outro" }
    ]
  },
  2: {
    id: 2,
    name: "Desafio atual",
    questionText: "Qual é o seu principal desafio profissional hoje?",
    descriptionText: "Conte com suas palavras o que está travando o seu avanço.",
    inputType: "text_or_voice",
    placeholder: "Ex: Não sei qual área de tecnologia focar e sinto que estou estudando sem direção...",
    minChars: 11
  },
  3: {
    id: 3,
    name: "Experiência com mentoria",
    questionText: "Você já teve alguma experiência anterior com mentoria?",
    inputType: "single_choice",
    chipOptions: [
      { value: "sim-util", label: "Sim, e foi muito útil" },
      { value: "sim-nao-boa", label: "Sim, mas não foi boa" },
      { value: "nao-interesse", label: "Não, mas tenho muito interesse" },
      { value: "nao-sei", label: "Não, não sei como funciona" },
      { value: "ouvi-falar", label: "Já ouvi falar, nunca participei" }
    ]
  },
  4: {
    id: 4,
    name: "Visão de futuro",
    questionText: "Onde você gostaria de estar profissionalmente nos próximos 1 a 2 anos?",
    descriptionText: "Descreva o seu objetivo ou o próximo patamar que quer atingir.",
    inputType: "text_or_voice",
    placeholder: "Ex: Quero conseguir meu primeiro emprego como desenvolvedor júnior em uma empresa legal...",
    minChars: 11
  },
  5: {
    id: 5,
    name: "Áreas de desenvolvimento",
    questionText: "Quais áreas você mais quer desenvolver com seu mentor?",
    descriptionText: "Você pode selecionar uma ou várias opções.",
    inputType: "multi_choice",
    allowOther: true,
    chipOptions: [
      { value: "Desenvolvimento técnico", label: "Desenvolvimento técnico" },
      { value: "Comunicação e networking", label: "Comunicação e networking" },
      { value: "Liderança e gestão", label: "Liderança e gestão" },
      { value: "Planejamento de carreira", label: "Planejamento de carreira" },
      { value: "Empreendedorismo", label: "Empreendedorismo" },
      { value: "Equilíbrio vida pessoal/profissional", label: "Equilíbrio vida pessoal/profissional" }
    ]
  },
  6: {
    id: 6,
    name: "Vida pessoal",
    questionText: "Tem algum desafio na sua vida pessoal que impacta sua carreira e você queira compartilhar?",
    descriptionText: "Totalmente opcional e confidencial. Se preferir, pode pular.",
    inputType: "text_or_voice",
    canSkip: true,
    placeholder: "Ex: Tenho dificuldade de conciliar o trabalho com os estudos da noite...",
    minChars: 11
  },
  7: {
    id: 7,
    name: "Compartilhar conhecimento",
    questionText: "No futuro, você teria interesse em ser mentor(a) voluntário(a) e ajudar outras pessoas?",
    inputType: "single_choice",
    chipOptions: [
      { value: "sim-muito", label: "Sim, com certeza!" },
      { value: "sim-talvez", label: "Talvez no futuro" },
      { value: "nao-pensou", label: "Nunca pensei sobre isso" },
      { value: "nao-tempo", label: "Gostaria, mas sem tempo agora" },
      { value: "ja-faco", label: "Já compartilho com frequência" }
    ]
  }
}

export const TOTAL_DIAGNOSTIC_STEPS = 7
