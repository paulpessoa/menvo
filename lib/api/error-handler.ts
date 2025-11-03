// =================================================================
// API ERROR HANDLER - Multi-Tenant System
// Centralized error handling for API routes
// =================================================================

import { NextResponse } from "next/server"

export interface ApiError {
  error: string
  code?: string
  details?: Record<string, any>
}

export interface ApiSuccess<T> {
  data: T
  message?: string
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  ORGANIZATION_NOT_ACTIVE: "ORGANIZATION_NOT_ACTIVE",
  ALREADY_MEMBER: "ALREADY_MEMBER",
  INVALID_CSV_FORMAT: "INVALID_CSV_FORMAT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Handles API errors and returns appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error("API Error:", error)

  // Handle known error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Quota errors
    if (message.includes("quota") || message.includes("limit")) {
      return NextResponse.json(
        {
          error: "Quota exceeded. Please upgrade your plan or contact support.",
          code: ErrorCodes.QUOTA_EXCEEDED
        },
        { status: 429 }
      )
    }

    // Not found errors
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Resource not found", code: ErrorCodes.NOT_FOUND },
        { status: 404 }
      )
    }

    // Token errors
    if (message.includes("token") && message.includes("invalid")) {
      return NextResponse.json(
        { error: "Invalid token", code: ErrorCodes.INVALID_TOKEN },
        { status: 400 }
      )
    }

    if (message.includes("token") && message.includes("expired")) {
      return NextResponse.json(
        { error: "Token has expired", code: ErrorCodes.TOKEN_EXPIRED },
        { status: 400 }
      )
    }

    // Database errors
    if (message.includes("database") || message.includes("postgres")) {
      return NextResponse.json(
        { error: "Database error occurred", code: ErrorCodes.DATABASE_ERROR },
        { status: 500 }
      )
    }

    // Generic error with message
    return NextResponse.json(
      { error: error.message, code: ErrorCodes.INTERNAL_ERROR },
      { status: 500 }
    )
  }

  // Unknown error
  return NextResponse.json(
    { error: "An unexpected error occurred", code: ErrorCodes.INTERNAL_ERROR },
    { status: 500 }
  )
}

/**
 * Creates a success response
 */
export function successResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data, message })
}

/**
 * Creates an error response with custom code and status
 */
export function errorResponse(
  error: string,
  code: ErrorCode,
  status: number = 400,
  details?: Record<string, any>
): NextResponse<ApiError> {
  return NextResponse.json({ error, code, details }, { status })
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields<T extends Record<string, any>>(
  body: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter((field) => !body[field])

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] }
  }

  return { valid: true }
}
