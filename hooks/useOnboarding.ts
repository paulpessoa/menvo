"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

function isVisible(element: Element): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden"
}

/**
 * Liga cada passo ao primeiro elemento VISÍVEL que casa com o seletor. Vários
 * alvos existem em duas versões (menu do topo só no desktop, barra fixa só no
 * celular, botão "Agendar" ou "Me avise" conforme a agenda), e o
 * `querySelector` do driver.js pegaria o primeiro mesmo escondido, deixando o
 * destaque no canto da tela. Sem alvo visível, o passo vira um popover
 * centralizado: o texto continua chegando, só sem destaque.
 */
export function resolveTourSteps(steps: DriveStep[], root: ParentNode = document): DriveStep[] {
  return steps.map(step => {
    if (typeof step.element !== "string") return step
    const target = Array.from(root.querySelectorAll(step.element)).find(isVisible)
    if (target) return { ...step, element: target }
    const { element: _hidden, ...centered } = step
    return centered
  })
}

/**
 * Tour guiado (driver.js) que aparece uma vez por usuário, até ele chegar ao
 * último passo; aí grava `onboarding_flags[tourId]` no perfil. Os passos são
 * lidos por ref: as páginas recriam o array a cada render, e com ele nas
 * dependências o tour era destruído e recomeçava do zero sempre que a página
 * terminava de carregar dados.
 */
export function useOnboarding(tourId: string, steps: DriveStep[], onComplete?: () => void) {
  const { profile, isAuthenticated, refreshProfile } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const stepsRef = useRef(steps)
  const onCompleteRef = useRef(onComplete)
  const refreshRef = useRef(refreshProfile)
  stepsRef.current = steps
  onCompleteRef.current = onComplete
  refreshRef.current = refreshProfile

  const hasProfile = Boolean(profile)
  const alreadySeen = Boolean(profile?.onboarding_flags?.[tourId])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !isAuthenticated || !hasProfile || alreadySeen) return

    let driverObj: ReturnType<typeof driver> | null = null
    let completed = false

    // Pequeno atraso para a página terminar de renderizar os alvos.
    const timer = setTimeout(() => {
      const instance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "rgba(0, 117, 133, 0.6)",
        doneBtnText: "Concluir",
        nextBtnText: "Próximo",
        prevBtnText: "Anterior",
        steps: resolveTourSteps(stepsRef.current),
        onDestroyStarted: () => {
          if (!instance.hasNextStep() || instance.isLastStep?.()) {
            completed = true
          }
          instance.destroy()
        },
        onDestroyed: async () => {
          if (!completed) return

          try {
            await fetch("/api/profile/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ flag: tourId, value: new Date().toISOString() })
            })
            await refreshRef.current()
            onCompleteRef.current?.()
          } catch (e) {
            console.error("Failed to save onboarding state:", e)
          }
        }
      })
      driverObj = instance
      instance.drive()
    }, 1000)

    return () => {
      clearTimeout(timer)
      driverObj?.destroy()
    }
  }, [isClient, isAuthenticated, hasProfile, alreadySeen, tourId])
}
