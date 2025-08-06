import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldOffIcon } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 text-center px-4">
      <ShieldOffIcon className="h-24 w-24 text-red-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">Acesso Não Autorizado</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-md">
        Você não tem permissão para acessar esta página. Por favor, faça login com uma conta autorizada ou entre em contato com o suporte.
      </p>
      <div className="flex gap-4">
        <Link href="/login" passHref>
          <Button>Fazer Login</Button>
        </Link>
        <Link href="/" passHref>
          <Button variant="outline">Voltar para a Página Inicial</Button>
        </Link>
      </div>
    </div>
  )
}
