"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <ShieldOff className="mb-6 h-20 w-20 text-red-500" />
      <h1 className="mb-3 text-4xl font-bold tracking-tight">Acesso Não Autorizado</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Você não tem permissão para acessar esta página. Por favor, faça login com uma conta que tenha as permissões necessárias.
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
