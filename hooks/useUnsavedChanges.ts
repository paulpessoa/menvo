"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface UnsavedChangesOptions {
  // Enable browser beforeunload warning
  enableBrowserWarning?: boolean
  
  // Custom message for browser warning
  browserWarningMessage?: string
  
  // Enable router navigation blocking
  enableRouterBlocking?: boolean
  
  // Callback when user tries to navigate away
  onNavigationAttempt?: () => void
  
  // Callback when changes are detected
  onChangesDetected?: (hasChanges: boolean) => void
}

export interface UnsavedChangesReturn {
  hasUnsavedChanges: boolean
  markAsSaved: () => void
  markAsChanged: () => void
  resetChanges: () => void
  confirmNavigation: () => boolean
}

export function useUnsavedChanges(
  formData: Record<string, any>,
  options: UnsavedChangesOptions = {}
): UnsavedChangesReturn {
  const {
    enableBrowserWarning = true,
    browserWarningMessage = 'Você tem alterações não salvas. Tem certeza que deseja sair?',
    enableRouterBlocking = true,
    onNavigationAttempt,
    onChangesDetected
  } = options

  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialData, setInitialData] = useState<Record<string, any>>({})
  const isInitialized = useRef(false)
  const navigationBlocked = useRef(false)

  // Initialize with current form data
  useEffect(() => {
    if (!isInitialized.current && formData) {
      setInitialData({ ...formData })
      isInitialized.current = true
    }
  }, [formData])

  // Deep comparison function
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true
    
    if (obj1 == null || obj2 == null) return obj1 === obj2
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2
    }
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!deepEqual(obj1[key], obj2[key])) return false
    }
    
    return true
  }, [])

  // Check for changes whenever form data changes
  useEffect(() => {
    if (!isInitialized.current) return
    
    const hasChanges = !deepEqual(formData, initialData)
    
    if (hasChanges !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasChanges)
      onChangesDetected?.(hasChanges)
    }
  }, [formData, initialData, hasUnsavedChanges, deepEqual, onChangesDetected])

  // Browser beforeunload warning
  useEffect(() => {
    if (!enableBrowserWarning) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = browserWarningMessage
        return browserWarningMessage
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, enableBrowserWarning, browserWarningMessage])

  // Router navigation blocking (Next.js specific)
  useEffect(() => {
    if (!enableRouterBlocking) return
    
    const handleRouteChange = () => {
      if (hasUnsavedChanges && !navigationBlocked.current) {
        onNavigationAttempt?.()
        // In Next.js 13+ with app router, we can't easily block navigation
        // This would need to be handled at the component level with confirmation dialogs
        return false
      }
      return true
    }

    // Note: This is a simplified version. In practice, you'd need to integrate
    // with Next.js router events or use a confirmation dialog
    
    return () => {
      // Cleanup if needed
    }
  }, [hasUnsavedChanges, enableRouterBlocking, onNavigationAttempt])

  const markAsSaved = useCallback(() => {
    setInitialData({ ...formData })
    setHasUnsavedChanges(false)
    navigationBlocked.current = false
  }, [formData])

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const resetChanges = useCallback(() => {
    setHasUnsavedChanges(false)
    navigationBlocked.current = false
  }, [])

  const confirmNavigation = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja continuar?'
      )
      if (confirmed) {
        navigationBlocked.current = true
        return true
      }
      return false
    }
    return true
  }, [hasUnsavedChanges])

  return {
    hasUnsavedChanges,
    markAsSaved,
    markAsChanged,
    resetChanges,
    confirmNavigation
  }
}

// Hook specifically for form dirty state tracking
export function useFormDirtyState(formData: Record<string, any>) {
  const [isDirty, setIsDirty] = useState(false)
  const [initialData, setInitialData] = useState<Record<string, any>>({})
  const isInitialized = useRef(false)

  // Initialize with current form data
  useEffect(() => {
    if (!isInitialized.current && formData) {
      setInitialData({ ...formData })
      isInitialized.current = true
    }
  }, [formData])

  // Check for changes
  useEffect(() => {
    if (!isInitialized.current) return
    
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData)
    setIsDirty(hasChanges)
  }, [formData, initialData])

  const markAsClean = useCallback(() => {
    setInitialData({ ...formData })
    setIsDirty(false)
  }, [formData])

  const markAsDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  return {
    isDirty,
    markAsClean,
    markAsDirty,
    hasChanges: isDirty
  }
}
