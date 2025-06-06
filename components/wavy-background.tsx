"use client"

import { useEffect, useRef } from "react"

export default function WavyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Create teal gradient
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#ffffff")
      gradient.addColorStop(0.3, "#f0fdfa") // teal-50
      gradient.addColorStop(0.5, "#ccfbf1") // teal-100
      gradient.addColorStop(0.7, "#5eead4") // teal-300
      gradient.addColorStop(0.85, "#2dd4bf") // teal-400
      gradient.addColorStop(1, "#14b8a6") // teal-500
      return gradient
    }

    // Create secondary gradient for depth
    const createSecondaryGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "rgba(20, 184, 166, 0.1)") // teal-500 with opacity
      gradient.addColorStop(0.5, "rgba(45, 212, 191, 0.2)") // teal-400 with opacity
      gradient.addColorStop(1, "rgba(94, 234, 212, 0.3)") // teal-300 with opacity
      return gradient
    }

    // Draw wave
    const drawWave = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fill background with white
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw main waves
      ctx.fillStyle = createGradient()

      // First wave (top)
      ctx.beginPath()
      ctx.moveTo(canvas.width, 0)

      // Create wave path
      for (let x = canvas.width; x > 0; x -= 8) {
        const y = Math.sin(x * 0.008 + time * 0.15) * 60 + Math.sin(x * 0.015 + time * 0.25) * 30 + canvas.height * 0.12
        ctx.lineTo(x, y)
      }

      // Complete the path
      ctx.lineTo(0, 0)
      ctx.lineTo(canvas.width, 0)
      ctx.closePath()
      ctx.fill()

      // Second wave (main body)
      ctx.beginPath()
      ctx.moveTo(canvas.width, canvas.height)

      // Create wave path
      for (let x = canvas.width; x > 0; x -= 8) {
        const y =
          Math.sin(x * 0.004 + time * 0.18) * 120 +
          Math.sin(x * 0.008 + time * 0.12) * 60 +
          Math.sin(x * 0.012 + time * 0.08) * 30 +
          canvas.height * 0.35
        ctx.lineTo(x, y)
      }

      // Complete the path
      ctx.lineTo(0, canvas.height)
      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()

      // Add overlay wave for depth
      ctx.fillStyle = createSecondaryGradient()
      ctx.beginPath()
      ctx.moveTo(canvas.width, canvas.height)

      for (let x = canvas.width; x > 0; x -= 10) {
        const y = Math.sin(x * 0.006 + time * 0.22) * 80 + Math.sin(x * 0.01 + time * 0.16) * 40 + canvas.height * 0.5
        ctx.lineTo(x, y)
      }

      ctx.lineTo(0, canvas.height)
      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()

      // Add floating dots pattern
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
      const dotSpacing = window.innerWidth < 768 ? 30 : 20 // Larger spacing on mobile
      for (let x = canvas.width * 0.6; x < canvas.width; x += dotSpacing) {
        for (let y = canvas.height * 0.1; y < canvas.height * 0.4; y += dotSpacing) {
          const size = Math.sin(x * 0.01 + y * 0.01 + time * 0.3) * 1.5 + 2
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Add subtle sparkles
      ctx.fillStyle = "rgba(20, 184, 166, 0.6)"
      for (let i = 0; i < 15; i++) {
        const x = canvas.width * 0.7 + Math.sin(time * 0.1 + i) * 100
        const y = canvas.height * 0.2 + Math.cos(time * 0.15 + i) * 80
        const size = Math.sin(time * 0.2 + i) * 1 + 1
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Animation loop
    const animate = () => {
      time += 0.03
      drawWave(time)
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
}
