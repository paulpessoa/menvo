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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {children}
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Floating Orbs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>

                {/* Moving Gradients */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-100/30 to-transparent dark:via-blue-900/20 transform rotate-12 animate-gradient-x"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-transparent via-purple-100/30 to-transparent dark:via-purple-900/20 transform -rotate-12 animate-gradient-x-reverse"></div>
                </div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '50px 50px'
                    }}></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            transform: translateX(-100%) rotate(12deg);
          }
          50% {
            transform: translateX(100%) rotate(12deg);
          }
        }
        
        @keyframes gradient-x-reverse {
          0%, 100% {
            transform: translateX(100%) rotate(-12deg);
          }
          50% {
            transform: translateX(-100%) rotate(-12deg);
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 20s ease-in-out infinite;
        }
        
        .animate-gradient-x-reverse {
          animation: gradient-x-reverse 25s ease-in-out infinite;
        }
      `}</style>
        </div>
    )
}