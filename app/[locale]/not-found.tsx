"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

export default function NotFound() {
  const t = useTranslations("common")
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="relative">
            <h1 className="text-9xl font-black text-primary/10 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-foreground">Opa! Página não encontrada</p>
            </div>
        </div>
        
        <p className="text-muted-foreground text-lg">
            Parece que o caminho que você seguiu não existe mais ou foi movido. 
            Não se preocupe, vamos te levar de volta para casa.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-5 w-5" />
              Página Inicial
            </Link>
          </Button>
          <Button onClick={() => window.history.back()} size="lg" className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  )
}
