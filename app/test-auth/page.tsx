"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function TestAuthPage() {
    const { user, profile, role, loading, isAuthenticated, signOut } = useAuth()

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Teste de Autenticação</h1>

            <div className="space-y-4">
                <div>
                    <strong>Autenticado:</strong> {isAuthenticated ? "Sim" : "Não"}
                </div>

                {user && (
                    <div>
                        <strong>Usuário:</strong>
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                            {JSON.stringify({
                                id: user.id,
                                email: user.email,
                                email_confirmed_at: user.email_confirmed_at
                            }, null, 2)}
                        </pre>
                    </div>
                )}

                {profile && (
                    <div>
                        <strong>Perfil:</strong>
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </div>
                )}

                <div>
                    <strong>Role:</strong> {role || "Nenhuma"}
                </div>

                {isAuthenticated && (
                    <Button onClick={signOut} variant="destructive">
                        Fazer Logout
                    </Button>
                )}

                {!isAuthenticated && (
                    <div className="space-x-2">
                        <Button asChild>
                            <a href="/auth/login">Fazer Login</a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/auth/register">Cadastrar</a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
