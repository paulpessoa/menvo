import { renderHook, act } from '@testing-library/react'
import {
  useFormValidation,
  PROFILE_VALIDATION_RULES,
  getFieldErrorClass,
  getFieldErrorMessage
} from './useFormValidation'

describe('useFormValidation', () => {
  it('should initialize with no errors and valid status when rules pass', () => {
    const formData = { first_name: 'Ana', last_name: 'Silva' }
    const { result } = renderHook(() =>
      useFormValidation(formData, {
        first_name: { required: true, minLength: 2 },
        last_name: { required: true }
      })
    )

    expect(result.current.errors).toEqual({})
    expect(result.current.isValid).toBe(true)
    expect(result.current.isDirty).toBe(false)
  })

  it('should validate required fields and report errors', () => {
    const formData = { first_name: '', last_name: '   ' }
    const { result } = renderHook(() =>
      useFormValidation(formData, {
        first_name: { required: true },
        last_name: { required: true }
      })
    )

    act(() => {
      const isValid = result.current.validate()
      expect(isValid).toBe(false)
    })

    expect(result.current.errors.first_name).toBe('Este campo é obrigatório')
    expect(result.current.errors.last_name).toBe('Este campo é obrigatório')
    expect(result.current.isValid).toBe(false)
  })

  it('should validate minLength and maxLength', () => {
    const formData = { short: 'a', long: 'abcdefghijk' }
    const { result } = renderHook(() =>
      useFormValidation(formData, {
        short: { minLength: 3 },
        long: { maxLength: 5 }
      })
    )

    act(() => {
      const isValid = result.current.validate()
      expect(isValid).toBe(false)
    })

    expect(result.current.errors.short).toBe('Mínimo de 3 caracteres')
    expect(result.current.errors.long).toBe('Máximo de 5 caracteres')
  })

  it('should validate regex patterns and custom validators', () => {
    const formData = {
      email: 'invalid-email',
      slug: '-invalid-slug-'
    }
    const { result } = renderHook(() =>
      useFormValidation(formData, {
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        slug: PROFILE_VALIDATION_RULES.slug
      })
    )

    act(() => {
      const isValid = result.current.validate()
      expect(isValid).toBe(false)
    })

    expect(result.current.errors.email).toBe('Formato inválido')
    expect(result.current.errors.slug).toBe('Slug não pode começar ou terminar com hífen')
  })

  it('should validate single field, clear error, and set manual error', () => {
    const formData = { first_name: '', last_name: 'Silva' }
    const { result } = renderHook(() =>
      useFormValidation(formData, {
        first_name: { required: true },
        last_name: { required: true }
      })
    )

    act(() => {
      const isFieldValid = result.current.validate('first_name')
      expect(isFieldValid).toBe(false)
    })
    expect(result.current.errors.first_name).toBe('Este campo é obrigatório')

    act(() => {
      result.current.clearError('first_name')
    })
    expect(result.current.errors.first_name).toBeUndefined()

    act(() => {
      result.current.setFieldError('first_name', 'Custom server error')
    })
    expect(result.current.errors.first_name).toBe('Custom server error')

    act(() => {
      result.current.clearAllErrors()
    })
    expect(result.current.errors).toEqual({})
  })

  it('should manage dirty state and utility helpers', () => {
    const formData = { test: '' }
    const { result } = renderHook(() => useFormValidation(formData, {}))

    expect(result.current.isDirty).toBe(false)
    act(() => {
      result.current.markAsDirty()
    })
    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.resetDirty()
    })
    expect(result.current.isDirty).toBe(false)

    expect(getFieldErrorClass({ field: 'error' }, 'field')).toBe('border-red-500 focus:border-red-500')
    expect(getFieldErrorClass({}, 'field')).toBe('')
    expect(getFieldErrorMessage({ field: 'error message' }, 'field')).toBe('error message')
    expect(getFieldErrorMessage({}, 'field')).toBeNull()
  })
})
