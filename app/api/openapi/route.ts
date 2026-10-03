import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { buildOpenApiDocument } from "@/lib/openapi/document"

export const dynamic = "force-dynamic"

/**
 * GET /api/openapi - the generated OpenAPI document (lib/openapi).
 *
 * Open in development; admin-only elsewhere. The API map helps anyone planning
 * an attack, so there is no reason to publish it. Security must not depend on
 * hiding it, but it also gains nothing from being public.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
  }
  return NextResponse.json(buildOpenApiDocument())
}
