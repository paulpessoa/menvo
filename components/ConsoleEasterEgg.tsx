"use client"

import { useEffect } from "react"

export function ConsoleEasterEgg() {
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === "development"
    
    // Design do Easter Egg
    const menvoLogo = `
   __  ___  _______  ____   ______
  /  |/  / / __/ _ \\/ _ /  / __  /
 / /|_/ / / _// / / / / / / /_/ / 
/_/  /_/ /___/_/ /_/_/ /_/\\____/  
    `

    console.log(
      `%c${menvoLogo}`,
      "color: #2563eb; font-weight: bold; font-family: monospace;"
    )

    console.log(
      "%c🚀 Bem-vindo ao Menvo! %cOnde o conhecimento encontra o propósito.",
      "color: #2563eb; font-size: 16px; font-weight: bold;",
      "color: #64748b; font-size: 14px;"
    )

    console.log(
      "%c✨ Desenvolvido com ❤️ pela equipe Menvo e voluntários apaixonados.",
      "color: #059669; font-size: 12px; font-weight: medium;"
    )

    if (!isDevelopment) {
      console.log(
        "%c🔍 Interessado em como construímos isso? %cConfira nosso repositório ou mande um 'Oi' para contato@menvo.com.br",
        "color: #d97706; font-size: 12px;",
        "color: #64748b; font-size: 12px;"
      )
    }

    console.log(
      "%c----------------------------------------------------------------",
      "color: #e2e8f0;"
    )
  }, [])

  return null
}
