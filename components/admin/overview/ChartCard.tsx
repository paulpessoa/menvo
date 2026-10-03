import type { ReactNode } from "react"
import { Link } from "@/i18n/routing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartCardProps {
  title: string
  /** One sentence on the decision this chart supports, not a restatement of the title. */
  description: string
  /** Admin page holding the detail behind the chart. */
  href?: string
  children: ReactNode
}

/** Frame shared by every overview chart: title, the question it answers, and a link to the detail page. */
export function ChartCard({ title, description, href, children }: ChartCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-medium text-primary hover:underline">
            Detalhes
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  )
}
