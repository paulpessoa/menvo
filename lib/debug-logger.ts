/**
 * Menvo Debug Logger
 * Utility to persist logs in localStorage for debugging fast redirections
 */

const STORAGE_KEY = 'menvo_debug_logs'
const MAX_LOGS = 50

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
  url: string
}

export const debugLog = (message: string, data?: any, level: LogEntry['level'] = 'info') => {
  if (typeof window === 'undefined') return

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    url: window.location.href
  }

  try {
    const existingLogsRaw = localStorage.getItem(STORAGE_KEY)
    const logs: LogEntry[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : []
    
    logs.unshift(entry)
    
    // Keep only last MAX_LOGS
    const trimmedLogs = logs.slice(0, MAX_LOGS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs))
    
    // Also log to console for real-time viewing
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](`[DEBUG] ${message}`, data || '')
  } catch (e) {
    console.error('Failed to save debug log', e)
  }
}

export const getDebugLogs = (): LogEntry[] => {
  if (typeof window === 'undefined') return []
  try {
    const logs = localStorage.getItem(STORAGE_KEY)
    return logs ? JSON.parse(logs) : []
  } catch (e) {
    return []
  }
}

export const clearDebugLogs = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
