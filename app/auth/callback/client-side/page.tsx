"use client"

import { useEffect, useState, Suspense } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react"

function ClientSideCallbackContent() {
    const [status, setStatus] = useState("Finalizando sua autenticação...")
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const exchangeCode = async () => {
            const code = searchParams.get("code")
            if (!code) {
                setError("Nenhum código de autenticação encontrado.")
                return
            }

            try {
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                
                if (exchangeError) {
                    console.error("Client-side exchange error:", exchangeError)
                    setError(`Falha na troca de código: ${exchangeError.message}`)
                    return
                }

                if (data.user) {
                    setStatus("Sucesso! Redirecionando...")
                    // Pequeno delay para garantir sincronia do perfil
                    await new Promise(r => setTimeout(r, 800))
                    
                    const { data: roleData } = await supabase
                        .from("user_roles")
                        .select(`roles (name)`)
                        .eq("user_id", data.user.id)
                        .single()

                    const roleName = (roleData?.roles as any)?.name
                    
                    if (roleName === 'admin') router.push("/admin")
                    else if (roleName === 'mentor') router.push("/dashboard/mentor")
                    else if (roleName === 'mentee') router.push("/dashboard/mentee")
                    else router.push("/dashboard")
                }
            } catch (err: any) {
                console.error("Unexpected client-side error:", err)
                setError("Ocorreu um erro inesperado durante o login.")
            }
        }

        exchangeCode()
    }, [searchParams, router, supabase])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border-2 border-red-100 text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro na Autenticação</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.href = '/login'}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-6">
                <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <ShieldCheck className="h-6 w-6 text-green-500 absolute bottom-0 right-1/2 translate-x-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{status}</h2>
                    <p className="text-gray-500">Estamos validando seus dados com segurança.</p>
                </div>
            </div>
        </div>
    )
}

export default function ClientSideCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            </div>
        }>
            <ClientSideCallbackContent />
        </Suspense>
    )
}
