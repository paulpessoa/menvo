import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-red-600">Acesso Não Autorizado</CardTitle>
          <CardDescription className="mt-2">
            Você não tem permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            Parece que você tentou acessar uma área restrita.
          </p>
          <p className="text-muted-foreground">
            Se você acredita que isso é um erro, por favor, entre em contato com o suporte.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/" passHref>
              <Button variant="outline">Voltar para a Página Inicial</Button>
            </Link>
            <Link href="/login" passHref>
              <Button>Fazer Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
