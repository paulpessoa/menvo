"use client"

import { useOnboarding } from "@/hooks/useOnboarding"

/**
 * Guided tour of the profile page (flag `ob_m4`). Renders nothing: it only
 * registers the steps. The element ids it points at (`tour-tab-*`,
 * `tour-profile-public`, `tour-profile-save`) live in the page and the sections,
 * so renaming one there means updating the step here.
 */
export function ProfileTour() {
  const steps = [
    { popover: { title: "Boas-vindas ao seu Perfil!", description: "Aqui é onde a comunidade vai te conhecer. Um perfil completo abre muitas portas." } },
    {
      element: "#tour-tab-basic",
      onHighlightStarted: () => { document.getElementById("tour-tab-basic")?.click() },
      popover: { title: "Perfil Básico", description: "Sua foto, nome e resumo (bio) são o seu cartão de visitas. Perfis bem preenchidos têm muito mais chances de receber pedidos e aceites na comunidade!" }
    },
    {
      element: "#tour-profile-public",
      popover: { title: "Perfil Público", description: "Ative para ser visível na rede! Mentores precisam disso para aparecerem no catálogo. Mentorados precisam para que os mentores possam ler o perfil antes de aceitar." }
    },
    {
      element: "#tour-tab-career",
      onHighlightStarted: () => { document.getElementById("tour-tab-career")?.click() },
      popover: { title: "O que você busca?", description: "Na aba Carreira e Interesses, deixe claro sua experiência e o que você espera das mentorias. Isso ajuda nossa IA a te recomendar para as pessoas certas." }
    },
    {
      element: "#tour-tab-mentorship",
      onHighlightStarted: () => { document.getElementById("tour-tab-mentorship")?.click() },
      popover: { title: "Seja um Mentor(a)!", description: "Compartilhar conhecimento é transformador! Se você tem experiência, ative seu perfil de mentor aqui. Retribuir à comunidade ensinando os outros é incrível." }
    },
    {
      element: "#tour-tab-basic",
      onHighlightStarted: () => { document.getElementById("tour-tab-basic")?.click() },
      popover: { title: "Tudo pronto?", description: "Volte para a primeira aba e comece a preencher seus dados. (Dica: A localização pode ser preenchida automaticamente usando o botão 'Detectar'!)" }
    },
    {
      element: "#tour-profile-save",
      popover: { title: "Não esqueça de salvar", description: "Lembre-se sempre de clicar em 'Salvar perfil' no final para não perder suas alterações!" }
    }
  ]

  useOnboarding("ob_m4", steps)

  return null
}
