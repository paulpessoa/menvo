'use client'

import React, { useEffect, useRef } from 'react'
import createGlobe from "cobe"
import { useSpring } from "react-spring"

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef(null)
  const pointerInteractionMovement = useRef(0)
  const [{ r }, api] = useSpring(() => ({
    r: 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 40,
      precision: 0.001,
    },
  }))

  useEffect(() => {
    let phi = 0
    let width = 0
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
    window.addEventListener("resize", onResize)
    onResize()
    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [0.8, 0.8, 0.8],
      markerColor: [251 / 255, 100 / 255, 21 / 255],
      glowColor: [1, 1, 1],
      markers: [
        // Example markers for Brazil (São Paulo, Rio de Janeiro, Brasília)
        { location: [-23.55052, -46.633308], size: 0.05 }, // São Paulo
        { location: [-22.906847, -43.172897], size: 0.05 }, // Rio de Janeiro
        { location: [-15.7801, -47.9292], size: 0.05 }, // Brasília
        // Add more markers as needed for other regions of impact
      ],
      onRender: (state) => {
        // This prevents the globe from spinning if the user is interacting with it
        if (!pointerInteracting.current) {
          state.phi = phi + r.get()
          phi += 0.005
        }
        state.width = width * 2
        state.height = width * 2
      },
    })
    return () => globe.destroy()
  }, [])

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1/1",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current
          canvasRef.current!.style.cursor = "grabbing"
        }}
        onPointerUp={() => {
          pointerInteracting.current = null
          canvasRef.current!.style.cursor = "grab"
        }}
        onPointerOut={() => {
          pointerInteracting.current = null
          canvasRef.current!.style.cursor = "grab"
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current
            pointerInteractionMovement.current = delta
            api.start({ r: delta / 200 })
          }
        }}
        onWheel={(e) => {
          api.start({ r: e.deltaY })
        }}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          contain: "layout paint",
          opacity: 0.9,
        }}
      />
    </div>
  )
}
