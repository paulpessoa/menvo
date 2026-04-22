"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Code, Brain, Database, AlertTriangle } from "lucide-react"

export default function GroqDebugPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    if (!query) return
    setLoading(true)
    setError(null)
    setDebugData(null)

    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, debug: true })
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Erro na API")
      }
      
      setDebugData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Brain className="text-primary h-10 w-10" /> Groq AI Lab
        </h1>
        <p className="text-muted-foreground mt-2">Teste e depure o motor de match inteligente do Menvo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1: Input e Controles */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" /> Testar Pergunta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="Ex: Quero estudar jornalismo" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTest()}
              />
              <Button 
                onClick={runTest} 
                className="w-full" 
                disabled={loading || !query}
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Executar Match"}
              </Button>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Code className="h-4 w-4" /> Resultado Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugData ? (
                <pre className="text-[10px] overflow-auto max-h-[300px]">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-500 text-xs italic">Aguardando execução...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2 e 3: Visualização do Processo */}
        <div className="lg:col-span-2 space-y-6">
           <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" /> O que a IA está "Vendo" (Contexto)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-auto max-h-[600px] bg-gray-50 p-4">
                  {debugData?.debug_context ? (
                    <div className="space-y-4">
                       <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-4">// {debugData.debug_context.length} mentores enviados para análise:</p>
                       <div className="space-y-3">
                          {debugData.debug_context.map((m: any) => (
                            <div key={m.id} className="p-3 bg-white rounded border border-gray-200 text-xs shadow-sm">
                               <div className="font-bold text-gray-900 mb-1">{m.full_name}</div>
                               <div className="text-gray-500 mb-2 font-medium">{m.job_title || 'Sem título'}</div>
                               <div className="flex flex-wrap gap-1">
                                  {m.mentor_skills?.map((s: string) => (
                                    <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-sm text-[10px]">{s}</span>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 p-4 italic">Nenhum contexto carregado. Digite uma dúvida e clique em Executar.</p>
                  )}
               </div>
            </CardContent>
          </Card>

          {debugData?.justification && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5" /> Justificativa do Groq
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-900 leading-relaxed italic font-medium">
                  "{debugData.justification}"
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {debugData.suggested_topics?.map((topic: string) => (
                    <Badge key={topic} className="bg-green-200 text-green-800 hover:bg-green-300 border-none">
                      #{topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
