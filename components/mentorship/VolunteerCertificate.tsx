"use client"

import React from "react"
import { Printer, Copy, Check, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { MentorCertificateData } from "@/lib/services/mentors/mentor-certificate.service"
import { CertificateSheet, SHEET_HEIGHT_PX, SHEET_WIDTH_PX } from "./CertificateSheet"

interface VolunteerCertificateProps {
  data: MentorCertificateData
}

/**
 * Impressão: só a folha, numa página A4 paisagem sem margens. Usa
 * `visibility` em vez de esconder o layout, para não depender de cada
 * header/footer do site ter `print:hidden`.
 */
const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  html, body { background: #fff !important; height: 210mm !important; overflow: hidden !important; }
  body * { visibility: hidden; }
  #certificate-sheet, #certificate-sheet * { visibility: visible; }
  #certificate-sheet {
    position: fixed; top: 0; left: 0;
    width: 297mm !important; height: 210mm !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  #certificate-scale { transform: none !important; }
}
`

/**
 * Certificado de Atuação Voluntária (C-T3) na página pública de verificação.
 * A folha tem tamanho fixo de A4 e é escalada para caber na largura
 * disponível, então fica igual na tela, no celular e no PDF, sem cortar o rodapé.
 */
export function VolunteerCertificate({ data }: VolunteerCertificateProps) {
  const [copied, setCopied] = React.useState(false)
  const [scale, setScale] = React.useState(1)
  const frameRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => setScale(Math.min(1, frame.clientWidth / SHEET_WIDTH_PX))
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.verificationUrl)
    setCopied(true)
    toast.success("Link de verificação copiado!")
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="mx-auto my-8 flex w-full max-w-5xl flex-col items-center gap-6">
      <style>{PRINT_CSS}</style>

      <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Certificado verificado: <strong>{data.verificationCode}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2 rounded-xl">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-2 rounded-xl bg-primary text-white">
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      <div ref={frameRef} className="w-full">
        <div
          className="mx-auto overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200"
          style={{ width: SHEET_WIDTH_PX * scale, height: SHEET_HEIGHT_PX * scale }}
        >
          <div id="certificate-scale" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <CertificateSheet data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}
