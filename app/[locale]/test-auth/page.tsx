"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Mail, Globe, Lock } from "lucide-react"

export default function TestAuthPage() {
    const [status, setStatus] = useState<string>("Pronto para testar")
    const supabase = createClient()

    const handleOAuth = async (provider: 'google' | 'linkedin') => {
        const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider
        setStatus(`Iniciando login com ${supabaseProvider}...`)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider as any,
            options: {
                redirectTo: `${window.location.origin}/callback`,
            }
        })

        if (error) {
            setStatus(`Erro: ${error.message}`)
            console.error(error)
        }
    }

    return (
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-8">
            <Card className="max-w-md w-full border-2 border-primary/20 shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Shield className="h-6 w-6 text-primary" /> Diagnóstico Auth
                    </CardTitle>
                    <CardDescription>
                        Teste os fluxos de login social de forma isolada
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg text-xs font-mono break-all">
                        Status: <span className="text-primary font-bold">{status}</span>
                    </div>

                    <div className="grid gap-3">
                        <Button 
                            className="w-full h-12 bg-white text-black border-2 hover:bg-gray-50 flex items-center justify-center gap-3"
                            onClick={() => handleOAuth('google')}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-1.8 4.47-1.12 1.13-2.9 2.37-6.04 2.37-4.88 0-8.6-3.96-8.6-8.84s3.72-8.84 8.6-8.84c2.64 0 4.54.98 5.92 2.37l2.3-2.3C18.42 1.12 15.65 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.67 0 6.45-1.2 8.65-3.52 2.25-2.25 2.96-5.4 2.96-8.05 0-.78-.07-1.52-.18-2.22H12.48z"/></svg>
                            Entrar com Google (API Path)
                        </Button>

                        <Button 
                            className="w-full h-12 bg-[#0077b5] text-white hover:bg-[#006699] flex items-center justify-center gap-3"
                            onClick={() => handleOAuth('linkedin')}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            Entrar com LinkedIn (API Path)
                        </Button>
                    </div>

                    <div className="pt-6 border-t">
                        <p className="text-[10px] text-muted-foreground text-center italic">
                            O retorno deste teste será em: /api/auth/callback
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
