"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from 'lucide-react'
import { ResendConfirmationEmail } from "@/components/auth/ResendConfirmationEmail"
import { EmailConfirmationBanner } from "@/components/auth/EmailConfirmationBanner"

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl font-bold">Confirme seu E-mail</CardTitle>
          <CardDescription>
            Um link de verificação foi enviado para o seu e-mail. Por favor, clique no link para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se você não recebeu o e-mail, verifique sua pasta de spam ou clique no botão abaixo para reenviar.
          </p>
          <ResendConfirmationEmail />
          <EmailConfirmationBanner />
          <Link href="/login" passHref>
            <Button variant="outline" className="w-full">Voltar para o Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
