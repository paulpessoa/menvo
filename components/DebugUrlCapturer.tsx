"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { debugLog, getDebugLogs, clearDebugLogs } from "@/lib/debug-logger"

export function DebugUrlCapturer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const logs = getDebugLogs()
        console.group('🔍 MENVO DEBUG LOGS')
        console.table(logs)
        console.groupEnd()
        alert('Logs despejados no console (F12)')
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        clearDebugLogs()
        alert('Logs limpos')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    if (Object.keys(params).length > 0 || pathname.includes('auth')) {
      debugLog(`Navigation to ${pathname}`, { params }, 'debug')
    }
    
    // Check for hash parameters (sometimes used by Supabase)
    if (typeof window !== 'undefined' && window.location.hash) {
      debugLog(`URL Hash detected: ${window.location.hash}`, null, 'debug')
    }
  }, [pathname, searchParams])

  return null
}
