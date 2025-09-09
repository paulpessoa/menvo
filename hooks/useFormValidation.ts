"use client"

import { useState, useCallback, useEffect } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface UseFormValidationReturn {
  errors: ValidationErrors;
  isValid: boolean;
  isDirty: boolean;
  validate: (field?: string) => boolean;
  validateField: (field: string, value: any) => string | null;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  setFieldError: (field: string, error: string) => void;
  markAsDirty: () => void;
  resetDirty: () => void;
}

export function useFormValidation(
  formData: Record<string, any>,
  rules: ValidationRules
): UseFormValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback((field: string, value: any): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Este campo é obrigatório';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return `Mínimo de ${rule.minLength} caracteres`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Máximo de ${rule.maxLength} caracteres`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Formato inválido';
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validate = useCallback((field?: string): boolean => {
    if (field) {
      // Validate single field
      const error = validateField(field, formData[field]);
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
      return !error;
    } else {
      // Validate all fields
      const newErrors: ValidationErrors = {};
      let isFormValid = true;

      Object.keys(rules).forEach(fieldName => {
        const error = validateField(fieldName, formData[fieldName]);
        if (error) {
          newErrors[fieldName] = error;
          isFormValid = false;
        }
      });

      setErrors(newErrors);
      return isFormValid;
    }
  }, [formData, rules, validateField]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const markAsDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  // Calculate if form is valid
  const isValid = Object.keys(errors).length === 0 || 
    Object.values(errors).every(error => !error);

  return {
    errors,
    isValid,
    isDirty,
    validate,
    validateField,
    clearError,
    clearAllErrors,
    setFieldError,
    markAsDirty,
    resetDirty,
  };
}

// Predefined validation rules for common fields
export const PROFILE_VALIDATION_RULES: ValidationRules = {
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  slug: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-z0-9-]+$/,
    custom: (value: string) => {
      if (value && value.startsWith('-') || value.endsWith('-')) {
        return 'Slug não pode começar ou terminar com hífen';
      }
      if (value && value.includes('--')) {
        return 'Slug não pode ter hífens consecutivos';
      }
      return null;
    }
  },
  bio: {
    maxLength: 500,
  },
  current_position: {
    maxLength: 100,
  },
  current_company: {
    maxLength: 100,
  },
  linkedin_url: {
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
    custom: (value: string) => {
      if (value && !value.includes('linkedin.com')) {
        return 'URL do LinkedIn inválida';
      }
      return null;
    }
  },
  portfolio_url: {
    pattern: /^https?:\/\/.+\..+/,
    custom: (value: string) => {
      if (value && !value.startsWith('http')) {
        return 'URL deve começar com http:// ou https://';
      }
      return null;
    }
  },
  personal_website_url: {
    pattern: /^https?:\/\/.+\..+/,
    custom: (value: string) => {
      if (value && !value.startsWith('http')) {
        return 'URL deve começar com http:// ou https://';
      }
      return null;
    }
  },
  city: {
    maxLength: 100,
  },
  state: {
    maxLength: 100,
  },
  country: {
    maxLength: 100,
  },
  mentorship_approach: {
    maxLength: 1000,
  },
  what_to_expect: {
    maxLength: 1000,
  },
  ideal_mentee: {
    maxLength: 1000,
  },
};

// Utility function to get field error class
export function getFieldErrorClass(errors: ValidationErrors, field: string): string {
  return errors[field] ? 'border-red-500 focus:border-red-500' : '';
}

// Utility function to show field error message
export function getFieldErrorMessage(errors: ValidationErrors, field: string): string | null {
  return errors[field] || null;
}
