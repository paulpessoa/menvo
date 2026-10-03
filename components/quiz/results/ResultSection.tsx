import type { ReactNode } from "react"

/**
 * Printing: show only the result (no site header, footer or floating widgets)
 * and drop the tinted background so it prints clean on paper / PDF.
 */
export const PRINT_STYLES = `
@media print {
  @page { margin: 20mm; }
  body * { visibility: hidden; }
  #quiz-result, #quiz-result * { visibility: visible; }
  #quiz-result { position: absolute; top: 0; left: 0; right: 0; padding: 0 !important; }
  body { background: #fff !important; }

  /* Reset UI elements for a document feel */
  .rounded-xl, .rounded-2xl, .rounded-lg, .rounded-full { border-radius: 0 !important; }
  .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
  .bg-card, .bg-accent, .bg-muted { background: transparent !important; border: none !important; }
  .border, .border-border, .border-primary\/20 { border-color: #e5e7eb !important; }

  /* Ensure text is readable */
  * { color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .text-muted-foreground { color: #374151 !important; }

  /* Hide unnecessary elements */
  .lucide, svg { display: none !important; }
}
`

export function ResultSection({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="break-inside-avoid-page">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
