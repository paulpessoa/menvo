import { z } from "zod"

/**
 * Response of `GET /api/legal/accept-terms`: whether the signed-in user has
 * accepted the current Terms of Use version. Shared by the OpenAPI contract and
 * by the client that parses the response, so both stay in sync with the route.
 */
export const termsStatusResponseSchema = z.object({ accepted: z.boolean() })

/** Response of `POST /api/legal/accept-terms`. */
export const termsAcceptResponseSchema = z.object({ ok: z.boolean() })

export type TermsStatusResponse = z.infer<typeof termsStatusResponseSchema>
