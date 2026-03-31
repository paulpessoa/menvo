"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useLogout } from "@/hooks/useLogout"

interface LogoutButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    redirectTo?: string
    showIcon?: boolean
    children?: React.ReactNode
    className?: string
}

export function LogoutButton({
    variant = "ghost",
    size = "default",
    redirectTo = "/",
    showIcon = true,
    children = "Sair",
    className = ""
}: LogoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { logout } = useLogout()

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            await logout(redirectTo)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center gap-2 ${className}`}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                showIcon && <LogOut className="h-4 w-4" />
            )}
            {children}
        </Button>
    )
}
