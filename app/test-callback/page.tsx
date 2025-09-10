"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestCallbackPage() {
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCallback = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Simular um código de confirmação
      const testCode = "test-code-123"
      const response = await fetch(`/auth/callback/debug?code=${testCode}&type=signup`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Erro ao testar callback", details: error })
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Erro ao verificar usuário", details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Teste de Callback de Autenticação</CardTitle>
          <CardDescription>
            Use esta página para testar o fluxo de confirmação de email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email para teste</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testCallback} disabled={loading}>
              {loading ? "Testando..." : "Testar Callback"}
            </Button>

            <Button onClick={checkUser} disabled={loading} variant="outline">
              Verificar Usuário Atual
            </Button>
          </div>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Como testar:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Faça um cadastro normal</li>
              <li>2. Copie o link do email de confirmação</li>
              <li>3. Cole aqui para analisar: <Input className="mt-1" placeholder="Cole o link aqui..." /></li>
              <li>4. Ou use o botão "Testar Callback" para simular</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}