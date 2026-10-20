import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

interface JoinPolicyCardProps {
  slug: string
  isOpen: boolean
  pending: boolean
  onToggle: (open: boolean) => void
}

/** Liga e desliga a entrada por pedido: aberta (qualquer pessoa logada pode pedir) ou só por convite. */
export function JoinPolicyCard({ slug, isOpen, pending, onToggle }: JoinPolicyCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Página pública</CardTitle>
        <CardDescription>
          {isOpen
            ? "Aberta: qualquer pessoa logada pode solicitar participação em /o/" + slug + "."
            : "Somente por convite: a página existe, mas ninguém pode solicitar participação sozinho - só quem você convidar entra."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Switch checked={isOpen} onCheckedChange={onToggle} disabled={pending} aria-label="Aceitar pedidos pela página pública" />
        <span className="text-sm">{isOpen ? "Aberta" : "Somente por convite"}</span>
      </CardContent>
    </Card>
  )
}
