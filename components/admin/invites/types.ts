export type InviteAudience = "selected" | "jotform_not_invited" | "never_signed_in" | "all"

export interface AudienceSkipped {
  suppressed: number
  optedOut: number
  alreadyInvited: number
  noEmail: number
}

export interface SendBatchResult {
  userId: string
  success: boolean
  error?: string
}

export const AUDIENCE_LABELS: Record<InviteAudience, string> = {
  selected: "Selecionados",
  jotform_not_invited: "Base JotForm ainda não convidada",
  never_signed_in: "Nunca entraram na plataforma",
  all: "Todos os usuários"
}

/** Texto padrão pré-preenchido no modal (docs/domains/reengagement-invites.md §6). */
export const DEFAULT_CAMPAIGN = "estagiorecife-2026"

export const DEFAULT_SUBJECT = "Novidade: o Estágio Recife agora tem mentoria (e você faz parte)"

export const DEFAULT_BODY = `Olá, {{primeiro_nome}}!

Tenho uma novidade. Você preencheu o formulário do Estágio Recife, e agora criamos a Menvo como uma extensão dele: uma plataforma gratuita de mentoria de carreira, onde quem está começando conversa com profissionais que já passaram pelo mesmo caminho.

Seus dados do formulário já estão lá. Falta só entrar, conferir e completar seu perfil.

E se você já se formou (é bem provável!), queremos muito ter você do outro lado também, como mentor ou mentora. Uma conversa sua pode mudar o rumo de alguém que está exatamente onde você esteve.

Um recado sincero: toco a Menvo de forma voluntária, nas horas vagas. Estamos refatorando a plataforma para dar vazão aos matches entre mentores e mentorados, então alguma coisa ainda pode estar em construção. Se não encontrar um mentor para o que você precisa, é só responder este e-mail que a gente te ajuda a achar.

Você não precisa saber quem pode te ajudar, você só precisa saber o que quer conversar.

Um abraço,
Paul`
