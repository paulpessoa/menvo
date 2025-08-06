"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <Frown className="mb-6 h-20 w-20 text-primary" />
      <h1 className="mb-3 text-4xl font-bold tracking-tight">404 - Página Não Encontrada</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Ops! Parece que a página que você está procurando não existe ou foi movida.
      </p>
      <Link href="/" passHref>
        <Button>Voltar para a Página Inicial</Button>
      </Link>
    </div>
  )
}
