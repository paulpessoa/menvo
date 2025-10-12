'use client'

import { useEffect, useState } from 'react'

interface AnimatedBackgroundProps {
  children: React.ReactNode
}

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Base Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-teal-50 to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

        {/* Animated Gradient Overlays */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-60 dark:opacity-40"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)
              `,
              animation: 'float 20s ease-in-out infinite'
            }}
          />
          <div
            className="absolute inset-0 opacity-20 dark:opacity-15"
            style={{
              background: `
                radial-gradient(circle at 60% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 30% 60%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)
              `,
              animation: 'float 25s ease-in-out infinite reverse'
            }}
          />
        </div>

        {/* Floating Orbs with Teal Colors */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-teal-400/20 to-cyan-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s', animationDuration: '4s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400/12 to-teal-400/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s', animationDuration: '3s' }}
        ></div>

        {/* Additional smaller orbs for more depth */}
        <div
          className="absolute top-1/6 right-1/3 w-48 h-48 bg-gradient-to-r from-teal-300/25 to-cyan-300/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: '3s', animationDuration: '5s' }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/6 w-56 h-56 bg-gradient-to-r from-emerald-300/20 to-teal-300/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: '4s', animationDuration: '6s' }}
        ></div>

        {/* Moving Waves */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-10 dark:opacity-5"
            style={{
              background: `
                linear-gradient(45deg, transparent 30%, rgba(20, 184, 166, 0.1) 50%, transparent 70%),
                linear-gradient(-45deg, transparent 30%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)
              `,
              animation: 'wave 30s linear infinite'
            }}
          />
          <div
            className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] opacity-8 dark:opacity-4"
            style={{
              background: `
                linear-gradient(135deg, transparent 30%, rgba(16, 185, 129, 0.06) 50%, transparent 70%)
              `,
              animation: 'wave 40s linear infinite reverse'
            }}
          />
        </div>

        {/* Subtle Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(20, 184, 166, 0.3) 1px, transparent 0)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Teal Grid Lines */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(20, 184, 166, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(20, 184, 166, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}