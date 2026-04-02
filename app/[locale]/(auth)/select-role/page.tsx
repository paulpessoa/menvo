"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "next-intl"

type UserRole = "mentee" | "mentor"

export default function SelectRolePage() {
    const t = useTranslations("onboarding")
    const [selectedRole, setSelectedRole] = useState<UserRole | "">("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { user, selectRole, getRoleDashboardPath } = useAuth()

    const roles = [
        {
            id: "mentee" as UserRole,
            name: t("mentee.title"),
            description: t("mentee.description"),
            icon: Users,
            color: "bg-blue-100 text-blue-800",
            benefits: t.raw("mentee.benefits") as string[],
        },
        {
            id: "mentor" as UserRole,
            name: t("mentor.title"),
            description: t("mentor.description"),
            icon: GraduationCap,
            color: "bg-green-100 text-green-800",
            benefits: t.raw("mentor.benefits") as string[],
        },
    ]

    const handleRoleSelection = async () => {
        if (!selectedRole) {
            toast.error(t("error.selectRequired"))
            return
        }

        if (!user) {
            toast.error(t("error.notAuthenticated"))
            router.push('/login')
            return
        }

        setIsLoading(true)
        const loadingToast = toast.loading(t("saving"))
        try {
            await selectRole(selectedRole)
            toast.dismiss(loadingToast)
            toast.success(t(`${selectedRole}.success`))

            await new Promise(resolve => setTimeout(resolve, 1000))
            const dashboardPath = getRoleDashboardPath(selectedRole)
            router.push(dashboardPath)
        } catch (error: any) {
            console.error("❌ Erro ao selecionar role:", error)
            toast.dismiss(loadingToast)

            let errorMessage = t("error.saveError")
            if (error.message?.includes('User not authenticated')) {
                errorMessage = t("error.sessionExpired")
                router.push('/login')
                return
            }

            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const { role, loading } = useAuth()
    
    if (!loading && role) {
        const dashboardPath = getRoleDashboardPath(role)
        router.push(dashboardPath)
        return null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )
    }

    if (!user) {
        router.push('/login')
        return null
    }

    return (
        <div className="container max-w-4xl py-16">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{t("title")}</CardTitle>
                    <CardDescription>
                        {t("description")}
                    </CardDescription>
                    {user?.email && (
                        <div className="text-sm text-muted-foreground mt-2">
                            {t("configuringFor")} <span className="font-medium">{user.email}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roles.map((role) => (
                            <Card
                                key={role.id}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${selectedRole === role.id
                                        ? "ring-2 ring-primary shadow-lg scale-105"
                                        : "hover:border-primary/50"
                                    } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
                                onClick={() => !isLoading && setSelectedRole(role.id)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2 rounded-lg ${role.color}`}>
                                            <role.icon className="h-6 w-6" />
                                        </div>
                                        {selectedRole === role.id && <CheckCircle className="h-5 w-5 text-primary" />}
                                    </div>
                                    <CardTitle className="text-lg">{role.name}</CardTitle>
                                    <CardDescription>{role.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{t("mentee.benefits" ? "Benefícios:" : "")}</p>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {role.benefits.map((benefit, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-current rounded-full" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button
                        onClick={handleRoleSelection}
                        disabled={!selectedRole || isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("saving")}
                            </>
                        ) : (
                            <>
                                {t("confirm")}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
