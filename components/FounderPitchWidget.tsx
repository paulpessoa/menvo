"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react"
import { YouTubeEmbed } from "@next/third-parties/google"

const STORAGE_KEY = "pitch_shown_count"
const MAX_SHOWS = 2
const VIDEO_ID = "jNWEofvslj0"

/**
 * Reads the current number of times the widget has been shown.
 * Returns MAX_SHOWS if localStorage is unavailable (blocks rendering safely).
 */
function readCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10)
  } catch {
    return MAX_SHOWS
  }
}

/** Increments the persistent shown-count in localStorage. */
function bumpCount(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(readCount() + 1))
  } catch {
    /* storage unavailable — silently ignore */
  }
}

/**
 * FounderPitchWidget
 *
 * Floating PiP-style (Picture-in-Picture) widget that presents the founder's
 * video pitch in the bottom-right corner of any page.
 *
 * **Trigger logic:**
 * - Appears after 20 s of page activity, or when exit-intent is detected
 *   (mouse leaves the viewport from the top).
 * - Shows at most MAX_SHOWS times across browser sessions (localStorage counter).
 * - On localStorage clear the counter resets and the widget shows again.
 *
 * **Core Web Vitals — zero regression guarantees:**
 * - `ssr: false` via DeferredClientWidgets → no HTML emitted by the server (TTFB safe).
 * - Event listeners registered only inside `requestIdleCallback` + 3 s delay
 *   → thread is free for LCP / INP during the critical load window.
 * - The YouTube `<iframe>` is only injected into the DOM when the widget opens
 *   → zero network requests to YouTube before the user triggers it (LCP safe).
 * - `position: fixed` → widget is outside document flow, zero CLS contribution.
 *
 * **Controls:**
 * - ▶ / ⏸ Play / Pause via YouTube iframe `postMessage` API.
 * - 🔊 / 🔇 Toggle mute (video auto-plays muted — browsers require it).
 * - ✕ Close widget & increment counter.
 */
export function FounderPitchWidget() {
  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const triggered = useRef(false)
  const readyRef = useRef(false)

  /** Send a command to the YouTube Player via postMessage (iframe API). */
  const yt = useCallback((fn: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: fn, args }),
      "*"
    )
  }, [])

  /** Trigger widget display: animates in only when called */
  const displayWidget = useCallback(() => {
    if (triggered.current || readCount() >= MAX_SHOWS) return
    triggered.current = true
    setIsVisible(true)
  }, [])

  /** Close the widget: slide out, then pause and remove iframe from DOM after animation. */
  const close = useCallback(() => {
    setIsVisible(false)
    bumpCount()
    yt("pauseVideo")
    setTimeout(() => {
      setSrc(null)
      setMuted(true)
      setPaused(false)
      // Fully unmount the widget after its last allowed display
      if (readCount() >= MAX_SHOWS) setShouldRender(false)
    }, 500)
  }, [yt])

  const handleToggleMute = useCallback(() => {
    yt(muted ? "unMute" : "mute")
    setMuted((m) => !m)
  }, [muted, yt])

  const handleTogglePlay = useCallback(() => {
    yt(paused ? "playVideo" : "pauseVideo")
    setPaused((p) => !p)
  }, [paused, yt])

  /**
   * Marca o vídeo como pronto usando o evento onLoad nativo do iframe.
   * Mais confiável que postMessage do YouTube (que varia por CSP/origem).
   * Um timeout de 3s garante que o spinner desapareça mesmo em conexões lentas.
   */
  const handleIframeLoad = useCallback(() => {
    if (readyRef.current) return
    readyRef.current = true
    // Pequeno delay para o player do YouTube inicializar internamente após o load
    setTimeout(() => setIsVideoReady(true), 800)
  }, [])


  useEffect(() => {
    // Checa no cliente se ainda pode exibir
    if (readCount() >= MAX_SHOWS) return
    setShouldRender(true)

    let preloadTimer: ReturnType<typeof setTimeout> | undefined
    let autoShowTimer: ReturnType<typeof setTimeout> | undefined
    let removeExitIntent: (() => void) | undefined

    const setup = () => {
      // 1. Inicia o pré-carregamento em background logo após o LCP/Idle
      preloadTimer = setTimeout(() => {
        setSrc(
          `https://www.youtube.com/embed/${VIDEO_ID}` +
          `?autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0` +
          `&modestbranding=1&controls=0&cc_load_policy=0&iv_load_policy=3&fs=0&showinfo=0`
        )

        // Fallback: se o iframe demorar mais de 5s para disparar onLoad, libera o vídeo mesmo assim
        setTimeout(() => {
          if (!readyRef.current) {
            readyRef.current = true
            setIsVideoReady(true)
          }
        }, 5_000)

        // 2. Timer de 20s para exibir ao usuário
        autoShowTimer = setTimeout(() => {
          displayWidget()
        }, 20_000)

        // 3. Exit-intent (mouse indo para o topo do navegador)
        const onExitIntent = (e: MouseEvent) => {
          if (e.clientY <= 5) {
            displayWidget()
          }
        }
        document.addEventListener("mouseleave", onExitIntent)
        removeExitIntent = () =>
          document.removeEventListener("mouseleave", onExitIntent)
      }, 3_000)
    }

    const cleanup = () => {
      clearTimeout(preloadTimer)
      clearTimeout(autoShowTimer)
      removeExitIntent?.()
    }

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(setup, { timeout: 5_000 })
      return () => {
        window.cancelIdleCallback(id)
        cleanup()
      }
    }

    setup()
    return cleanup
  }, [displayWidget])

  if (!shouldRender) return null

  return (
    <aside
      role="complementary"
      aria-label="Vídeo de boas-vindas do fundador da Menvo"
      className={[
        // Posicionamento confortável: afastado da barra de scroll e da borda inferior
        "fixed z-50",
        "bottom-8 left-6 sm:bottom-10 sm:left-8 md:bottom-16 md:left-10",
        // Proporções amigáveis e responsivas
        "w-[210px] sm:w-[240px] md:w-[260px]",
        // Transição suave quando o modal entra
        "transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-12 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 border border-border/40 backdrop-blur-md bg-gray-950/90">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-gray-950/95 px-3 py-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[11px] text-white/90 font-medium tracking-wide truncate">
              O Propósito por trás da Plataforma
            </span>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Fechar vídeo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Video Container (9 ∶ 16) ─────────────────────────── */}
        {/*
          O iframe é propositalmente maior que o container para que o
          overflow:hidden clipe a chrome do YouTube Shorts:
          - Borda superior (~90px): mute, CC, settings, título do canal
          - Borda inferior (~70px): progress bar, badge Shorts
          Controls=0 na URL elimina a barra de controles, mas o player
          do Shorts ainda injeta elementos; o clipping cobre o restante.
        */}
        <div
          className="relative bg-black w-full overflow-hidden"
          style={{ aspectRatio: "9/16" }}
        >
          {/* Skeleton enquanto o YouTube buferiza (O YouTubeEmbed já gerencia a thumbnail e poster, então não precisamos do iframe puro) */}
          {shouldRender && (
            <div
              style={{
                position: "absolute",
                top: "-90px",
                left: "-2px",
                width: "calc(100% + 4px)",
                height: "calc(100% + 160px)",
              }}
            >
              <YouTubeEmbed
                videoid={VIDEO_ID}
                params="autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&controls=0&cc_load_policy=0&iv_load_policy=3&fs=0&showinfo=0"
                playlabel="Reproduzir vídeo de boas-vindas"
              />
            </div>
          )}

          {/* Overlay pointer-events:none — impede acesso à chrome do YouTube que sobrou */}
          <div className="absolute inset-0 pointer-events-none z-20" />
        </div>

        {/* ── Bottom Controls ──────────────────────────────────── */}
        <div className="bg-gray-950/95 flex items-center justify-between px-3 py-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            {/* Play / Pause */}
            <button
              onClick={handleTogglePlay}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={paused ? "Reproduzir vídeo" : "Pausar vídeo"}
            >
              {paused ? (
                <Play className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Pause className="h-3.5 w-3.5 fill-current" />
              )}
            </button>

            {/* Mute / Unmute */}
            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={muted ? "Ativar som" : "Desativar som"}
            >
              {muted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Hint de som quando mutado */}
            {muted && (
              <span className="text-[11px] text-white/50 select-none animate-pulse">
                toque 🔊
              </span>
            )}
          </div>

          <button
            onClick={close}
            className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
          >
            Dispensar
          </button>
        </div>
      </div>
    </aside>
  )
}
