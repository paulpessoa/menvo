"use client"

import { useEffect } from "react"

const SWAGGER_VERSION = "5.29.1"
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}`

declare global {
  interface Window {
    SwaggerUIBundle?: (config: { url: string; dom_id: string }) => unknown
  }
}

/**
 * Swagger UI for the generated OpenAPI document (`/api/openapi`, lib/openapi).
 * Loaded from the CDN instead of bundled: it is an admin-only tool and the
 * package is heavy. Admin access comes from the parent layout (`RequireRole`)
 * and from `requireAdmin` on the document route itself.
 */
export default function ApiDocsPage() {
  useEffect(() => {
    const style = document.createElement("link")
    style.rel = "stylesheet"
    style.href = `${CDN}/swagger-ui.css`
    document.head.appendChild(style)

    const script = document.createElement("script")
    script.src = `${CDN}/swagger-ui-bundle.js`
    script.onload = () => window.SwaggerUIBundle?.({ url: "/api/openapi", dom_id: "#swagger-ui" })
    document.body.appendChild(script)

    return () => {
      style.remove()
      script.remove()
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">API Menvo</h1>
      <div id="swagger-ui" />
    </div>
  )
}
