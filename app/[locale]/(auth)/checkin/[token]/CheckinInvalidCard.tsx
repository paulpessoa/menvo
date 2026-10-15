import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

/**
 * Token inexistente, adulterado, vencido ou substituído por um lembrete mais
 * novo. Não diz qual dos casos é, para não confirmar a terceiros que uma
 * sessão existe.
 */
export function CheckinInvalidCard() {
  return (
    <Card className="w-full border-amber-100 bg-amber-50/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle className="text-amber-800">Link expirado ou inválido</CardTitle>
        <CardDescription>
          Este link não vale mais. Se você recebeu um lembrete depois, use o link do e-mail mais recente,
          ou entre na Menvo para ver suas mentorias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">Entrar na Menvo</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
