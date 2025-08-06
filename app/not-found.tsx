import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FrownIcon } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 text-center px-4">
      <FrownIcon className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-50 mb-4">404 - Página Não Encontrada</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-md">
        Parece que a página que você está procurando não existe ou foi movida.
      </p>
      <Link href="/" passHref>
        <Button size="lg">Voltar para a Página Inicial</Button>
      </Link>
    </div>
  )
}
