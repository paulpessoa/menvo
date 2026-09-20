"use client"

import { useState, useEffect } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"

declare global {
  interface Window {
    dataLayer?: Object[];
    gtag: (...args: any[]) => void;
    gtag_initialized?: boolean;
  }
}

export function AnalyticsWrapper() {
  const [interacted, setInteracted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Se o usuário já interagiu nesta sessão, não precisamos esperar de novo.
    if (sessionStorage.getItem("analytics_injected")) {
      setInteracted(true)
      return
    }

    let timeoutId: NodeJS.Timeout

    const handleInteraction = () => {
      setInteracted(true)
      sessionStorage.setItem("analytics_injected", "true")
      cleanup()
    }

    const cleanup = () => {
      window.removeEventListener("scroll", handleInteraction)
      window.removeEventListener("mousemove", handleInteraction)
      window.removeEventListener("touchstart", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
      window.removeEventListener("click", handleInteraction)
      clearTimeout(timeoutId)
    }

    // Ouve as interações básicas
    window.addEventListener("scroll", handleInteraction, { passive: true })
    window.addEventListener("mousemove", handleInteraction, { passive: true })
    window.addEventListener("touchstart", handleInteraction, { passive: true })
    window.addEventListener("keydown", handleInteraction, { passive: true })
    window.addEventListener("click", handleInteraction, { passive: true })

    // Falha de segurança: Carrega após 5 segundos se o usuário apenas "olhar" para a tela sem tocar em nada
    timeoutId = setTimeout(() => {
      handleInteraction()
    }, 5000)

    return cleanup
  }, [])

  // Registrar a visualização de página no GA quando a rota muda, SE o script já foi injetado
  useEffect(() => {
    if (interacted && typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "G-Y2ETF2ENBD", {
        page_path: pathname,
      })
    }
  }, [pathname, interacted])

  if (!interacted) return null

  return (
    <>
      {/* Google Analytics (GTM) */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-Y2ETF2ENBD"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          if(!window.gtag_initialized) {
            gtag('js', new Date());
            window.gtag_initialized = true;
          }
          gtag('config', 'G-Y2ETF2ENBD', {
            page_path: window.location.pathname,
          });
        `}
      </Script>

      {/* Microsoft Clarity */}
      <Script
        id="clarity-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "rz28fusa38");`,
        }}
      />
    </>
  )
}
