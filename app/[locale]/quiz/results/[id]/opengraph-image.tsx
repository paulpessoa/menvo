import { ImageResponse } from "next/og"
import { getQuizResultPreview } from "@/lib/services/quiz/quiz-result.server"

export const alt = "Diagnóstico de carreira no MENVO"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Brand palette (see app/[locale]/globals.css: --primary 187 100% 26%)
const PRIMARY = "#007385"
const PRIMARY_DARK = "#004f5c"
const ACCENT = "#e6f6f8"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const preview = await getQuizResultPreview(id)
  const headline =
    preview && !preview.needsRetake ? preview.title : "Descubra seu próximo passo na carreira"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${PRIMARY} 100%)`,
          color: "white",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>MENVO</div>
          <div
            style={{
              fontSize: 24,
              padding: "6px 18px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.15)",
              color: ACCENT
            }}
          >
            Diagnóstico de carreira
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: headline.length > 60 ? 60 : 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            maxWidth: 1000
          }}
        >
          {headline}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: ACCENT }}>
          <span>Plano de ação + mentores voluntários</span>
          <span>menvo.com.br/quiz</span>
        </div>
      </div>
    ),
    size
  )
}
