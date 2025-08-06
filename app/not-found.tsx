import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-5xl font-bold text-gray-900 dark:text-gray-50">404</CardTitle>
          <CardDescription className="mt-2 text-xl">Página Não Encontrada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            A página que você está procurando não existe ou foi movida.
          </p>
          <p className="text-muted-foreground">
            Por favor, verifique o URL ou volte para a página inicial.
          </p>
          <Link href="/" passHref>
            <Button>Voltar para a Página Inicial</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
