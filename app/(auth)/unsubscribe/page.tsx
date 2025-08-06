"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from "next/navigation"
import { useNewsletter } from "@/hooks/useNewsletter"
import { useToast } from "@/hooks/useToast"

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const token = searchParams.get("token")
  const { unsubscribe } = useNewsletter()
  const { toast } = useToast()

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleUnsubscribe = async () => {
      if (!email || !token) {
        setStatus("error")
        setMessage("Link de descadastro inválido ou incompleto.")
        toast({
          title: "Erro no descadastro",
          description: "Link inválido ou incompleto.",
          variant: "destructive",
        })
        return
      }

      try {
        const { success, error } = await unsubscribe(email, token)

        if (success) {
          setStatus("success")
          setMessage("Você foi descadastrado com sucesso da nossa lista de e-mails.")
          toast({
            title: "Descadastro bem-sucedido!",
            description: "Você não receberá mais nossos e-mails.",
            variant: "default",
          })
        } else {
          setStatus("error")
          setMessage(error || "Ocorreu um erro ao tentar descadastrar seu e-mail. O link pode ter expirado ou ser inválido.")
          toast({
            title: "Erro no descadastro",
            description: error || "Não foi possível descadastrar. Tente novamente ou entre em contato.",
            variant: "destructive",
          })
        }
      } catch (err: any) {
        setStatus("error")
        setMessage(err.message || "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.")
        toast({
          title: "Erro inesperado",
          description: err.message || "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    }

    handleUnsubscribe()
  }, [email, token, unsubscribe, toast])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          {status === "loading" && (
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          )}
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Processando descadastro..."}
            {status === "success" && "Descadastro Concluído!"}
            {status === "error" && "Erro no Descadastro"}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" passHref>
            <Button className="w-full">Voltar para a Página Inicial</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
