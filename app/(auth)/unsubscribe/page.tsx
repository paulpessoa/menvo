"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"
import { useNewsletterUnsubscribe } from "@/hooks/useNewsletter"

export default function UnsubscribePage() {
  const [email, setEmail] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  
  const unsubscribeMutation = useNewsletterUnsubscribe()

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await unsubscribeMutation.mutateAsync(email)
      setIsSuccess(true)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  if (isSuccess) {
    return (
      <div className="container max-w-md py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Inscrição cancelada com sucesso</CardTitle>
            <CardDescription>
              Você foi removido da nossa lista de newsletter. Sentiremos sua falta! 😢
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se mudou de ideia, você pode se inscrever novamente a qualquer momento através do nosso site.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = '/'}
              >
                Voltar ao site
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  setIsSuccess(false)
                  setEmail("")
                }}
              >
                Inscrever novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Cancelar inscrição da newsletter</CardTitle>
          <CardDescription>
            Lamentamos que você queira sair. Digite seu email para cancelar a inscrição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Antes de cancelar, considere:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Você receberá apenas conteúdo relevante sobre mentoria</li>
                    <li>• Enviamos no máximo 2 emails por semana</li>
                    <li>• Você pode se reinscrever a qualquer momento</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="destructive"
              className="w-full"
              disabled={!email.includes('@') || unsubscribeMutation.isPending}
            >
              {unsubscribeMutation.isPending ? 'Cancelando...' : 'Cancelar inscrição'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Voltar ao site
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 