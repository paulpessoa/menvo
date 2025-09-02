"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { useAuth } from "@/lib/auth"

export default function RegisterPage() {
    const router = useRouter()
    const { user, role, loading } = useAuth()

    const isAuthenticated = !!user && !loading
    const needsRoleSelection = user && !role

    useEffect(() => {
        if (isAuthenticated) {
            if (needsRoleSelection) {
                router.push("/auth/select-role")
            } else {
                router.push("/dashboard")
            }
        }
    }, [isAuthenticated, needsRoleSelection, router])

    // Show loading while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    // Don't render form if user is already authenticated
    if (isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <RegisterForm />
        </div>
    )
}