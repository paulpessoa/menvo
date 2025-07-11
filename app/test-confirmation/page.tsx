"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestConfirmationPage() {
  return (
    <div className="container max-w-lg py-16 flex flex-col items-center text-center">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Confirmação</CardTitle>
          <CardDescription>
            Teste os diferentes estados da página de confirmação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/confirmation">
              Estado Normal (Email Confirmado + Seleção de Role)
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/confirmation?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired">
              Estado de Email Expirado
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
                    <span className="text-muted-foreground">
          Modal de Role Selection (Usuário Logado sem Role)
        </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 