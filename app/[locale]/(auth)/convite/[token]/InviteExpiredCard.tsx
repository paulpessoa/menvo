import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

/**
 * Estado exibido quando o token não existe, foi adulterado ou expirou.
 * Nunca revela qual desses três é o motivo real — só que o link "expirou
 * ou é inválido" — para não confirmar a um terceiro que um e-mail
 * específico existe na base (ver resolveInviteToken).
 */
export function InviteExpiredCard({ reason }: { reason: "invalid" | "expired" }) {
  return (
    <Card className="w-full max-w-md border-amber-100 bg-amber-50/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle className="text-amber-800">Link expirado ou inválido</CardTitle>
        <CardDescription>
          {reason === "expired"
            ? "Este convite não é mais válido. Mas você ainda pode acessar a Menvo normalmente."
            : "Não encontramos este convite. Ele pode já ter sido usado ou o link pode estar incompleto."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot-password">Esqueci minha senha</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
