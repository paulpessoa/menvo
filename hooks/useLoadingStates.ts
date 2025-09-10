"use client"

import { useState, useCallback } from 'react'

export interface LoadingStates {
  // Profile operations
  isUpdatingProfile: boolean
  isLoadingProfile: boolean
  
  // File uploads
  isUploadingImage: boolean
  isUploadingCV: boolean
  
  // Form states
  isSubmitting: boolean
  
  // General loading
  isLoading: boolean
}

export interface LoadingActions {
  setProfileLoading: (loading: boolean) => void
  setProfileUpdating: (updating: boolean) => void
  setImageUploading: (uploading: boolean) => void
  setCVUploading: (uploading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setGeneralLoading: (loading: boolean) => void
  
  // Computed states
  hasAnyLoading: () => boolean
  hasFormDisabling: () => boolean
  getLoadingMessage: () => string
}

export function useLoadingStates(): LoadingStates & LoadingActions {
  const [states, setStates] = useState<LoadingStates>({
    isUpdatingProfile: false,
    isLoadingProfile: false,
    isUploadingImage: false,
    isUploadingCV: false,
    isSubmitting: false,
    isLoading: false,
  })

  const setProfileLoading = useCallback((loading: boolean) => {
    setStates(prev => ({ ...prev, isLoadingProfile: loading }))
  }, [])

  const setProfileUpdating = useCallback((updating: boolean) => {
    setStates(prev => ({ ...prev, isUpdatingProfile: updating }))
  }, [])

  const setImageUploading = useCallback((uploading: boolean) => {
    setStates(prev => ({ ...prev, isUploadingImage: uploading }))
  }, [])

  const setCVUploading = useCallback((uploading: boolean) => {
    setStates(prev => ({ ...prev, isUploadingCV: uploading }))
  }, [])

  const setSubmitting = useCallback((submitting: boolean) => {
    setStates(prev => ({ ...prev, isSubmitting: submitting }))
  }, [])

  const setGeneralLoading = useCallback((loading: boolean) => {
    setStates(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const hasAnyLoading = useCallback(() => {
    return Object.values(states).some(Boolean)
  }, [states])

  const hasFormDisabling = useCallback(() => {
    return states.isUpdatingProfile || states.isSubmitting
  }, [states.isUpdatingProfile, states.isSubmitting])

  const getLoadingMessage = useCallback(() => {
    if (states.isUpdatingProfile) return 'Salvando perfil...'
    if (states.isUploadingImage) return 'Enviando imagem...'
    if (states.isUploadingCV) return 'Enviando CV...'
    if (states.isSubmitting) return 'Processando...'
    if (states.isLoadingProfile) return 'Carregando perfil...'
    if (states.isLoading) return 'Carregando...'
    return ''
  }, [states])

  return {
    ...states,
    setProfileLoading,
    setProfileUpdating,
    setImageUploading,
    setCVUploading,
    setSubmitting,
    setGeneralLoading,
    hasAnyLoading,
    hasFormDisabling,
    getLoadingMessage,
  }
}

// Utility hook for form field states
export function useFormFieldState(isDisabled: boolean = false) {
  return {
    disabled: isDisabled,
    className: isDisabled ? 'opacity-60 cursor-not-allowed' : '',
  }
}

// Utility hook for button states
export function useButtonState(
  isLoading: boolean = false, 
  isDisabled: boolean = false,
  loadingText: string = 'Carregando...'
) {
  return {
    disabled: isLoading || isDisabled,
    loading: isLoading,
    text: isLoading ? loadingText : undefined,
    className: isLoading ? 'cursor-not-allowed' : '',
  }
}