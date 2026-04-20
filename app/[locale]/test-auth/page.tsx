"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle2, Globe, Key } from "lucide-react"

export default function TestAuthPage() {
    const [status, setStatus] = useState<string>("Pronto para testar")
    const [envCheck, setEnvCheck] = useState<any>({
        url: "",
        anonKey: "",
        origin: ""
    })
    const supabase = createClient()

    useEffect(() => {
        setEnvCheck({
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurada" : "❌ Faltando",
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ Faltando",
            origin: typeof window !== 'undefined' ? window.location.origin : ""
        })
    }, [])

    const handleOAuth = async (provider: 'google' | 'linkedin') => {
        const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider
        setStatus(`Iniciando login com ${supabaseProvider}...`)
        
        const redirectTo = `${window.location.origin}/auth/callback`
        console.log("Iniciando OAuth com RedirectTo:", redirectTo)

        const { error } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider as any,
            options: {
                redirectTo,
                queryParams: provider === 'google' ? {
                    access_type: 'offline',
                    prompt: 'consent'
                } : undefined
            }
        })

        if (error) {
            setStatus(`Erro: ${error.message}`)
            console.error(error)
        }
    }

    return (
        <div className="container mx-auto px-4 py-12 flex flex-col items-center space-y-8">
            <h1 className="text-4xl font-bold text-primary">Painel de Diagnóstico Auth</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Coluna 1: Teste de Botões */}
                <Card className="border-2 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" /> Teste de Fluxo
                        </CardTitle>
                        <CardDescription>Use estes botões para testar a "ida" ao provedor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-muted rounded text-xs font-mono break-all border">
                            Status Atual: <span className="text-blue-600 font-bold">{status}</span>
                        </div>

                        <Button 
                            className="w-full h-12 bg-white text-black border-2 hover:bg-gray-50 flex items-center justify-center gap-3"
                            onClick={() => handleOAuth('google')}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-1.8 4.47-1.12 1.13-2.9 2.37-6.04 2.37-4.88 0-8.6-3.96-8.6-8.84s3.72-8.84 8.6-8.84c2.64 0 4.54.98 5.92 2.37l2.3-2.3C18.42 1.12 15.65 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.67 0 6.45-1.2 8.65-3.52 2.25-2.25 2.96-5.4 2.96-8.05 0-.78-.07-1.52-.18-2.22H12.48z"/></svg>
                            Testar Google (PKCE)
                        </Button>

                        <Button 
                            className="w-full h-12 bg-[#0077b5] text-white hover:bg-[#006699] flex items-center justify-center gap-3"
                            onClick={() => handleOAuth('linkedin')}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            Testar LinkedIn (OIDC)
                        </Button>
                    </CardContent>
                </Card>

                {/* Coluna 2: Verificação de Variáveis */}
                <Card className="border-2 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-yellow-500" /> Infraestrutura (Browser)
                        </CardTitle>
                        <CardDescription>O que o navegador está "enxergando".</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm border-b pb-1">
                                <span>Supabase URL:</span>
                                <span className="font-bold">{envCheck.url}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-1">
                                <span>Anon Key:</span>
                                <span className="font-bold">{envCheck.anonKey}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-1">
                                <span>Site Origin:</span>
                                <span className="font-bold text-blue-600">{envCheck.origin}</span>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-[10px] text-yellow-800 leading-tight">
                            <AlertTriangle className="h-4 w-4 mb-1" />
                            <strong>Aviso Staff:</strong> Se o Site Origin for <code>www.menvo.com.br</code>, a URL no Google Console DEVE conter o Supabase ID como callback, e o Supabase deve ter o www autorizado nas Redirect URLs.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="w-full max-w-4xl border-2 border-green-100 bg-green-50/20">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Checklist de Resolução (Manual)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Vá no Google Console: O redirect URI é <code>https://evxrzmzkghshjmmyegxu.supabase.co/auth/v1/callback</code>?</li>
                        <li>No Supabase: O Client Secret do Google é o mesmo que você gerou hoje?</li>
                        <li>No Supabase: Em "Redirect URLs", tem <code>https://www.menvo.com.br/auth/callback</code>?</li>
                    </ul>
                    <ul className="list-disc pl-5 space-y-1 text-red-600">
                        <li><strong>DICA DE OURO:</strong> Se você copiou o Client Secret do Google e veio com um ESPAÇO no final, o erro 4/0A acontece.</li>
                        <li>Verifique se o seu projeto no Google não está em "Testing Mode" com o limite de usuários atingido.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
