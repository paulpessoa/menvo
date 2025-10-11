import { NextResponse } from 'next/server'

export class ErrorHandler {
  static handleApiError(
    error: Error,
    code: string,
    status: number,
    message?: string
  ) {
    return NextResponse.json(
      {
        error: message || error.message,
        code,
      },
      { status }
    )
  }
}
