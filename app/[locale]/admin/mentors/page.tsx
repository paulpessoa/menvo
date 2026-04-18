"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminMentorsRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Redireciona para a central unificada com o filtro de mentores ativo
        router.replace("/admin/users?tab=mentors")
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground font-medium">Redirecionando para a Central de Gestão...</p>
            </div>
        </div>
    )
}
