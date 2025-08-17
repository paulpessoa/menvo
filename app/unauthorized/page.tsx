"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página.
           </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => router.back()} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button asChild className="w-full">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ir para Dashboard
            </Link>
          </Button>
          <Button asChild className="w-full mt-2">
            <Link href="/contact">
              Contatar Suporte
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
