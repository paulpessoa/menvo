import { createClient } from "@/lib/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ResendForm } from "./ResendForm"

export default async function ResendConfirmationPage({ params }: { params: { locale: string } }) {
  const { locale } = await params
  const supabase = await createClient()
  const t = await getTranslations("auth.resend")

  const { data: { user } } = await supabase.auth.getUser()

  // LÓGICA DE SERVIDOR: Se o usuário já estiver logado e com e-mail confirmado
  if (user && user.email_confirmed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-xl animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t("alreadyVerifiedTitle")}
            </CardTitle>
            <CardDescription className="text-base text-gray-500">
              {t("alreadyVerifiedMessage")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 text-center">
               {t("alreadyVerifiedDetail", { email: user.email || "" })}
            </div>
            <Link href={`/${locale}/dashboard`} className="block w-full">
              <Button className="w-full h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Ir para o Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResendForm 
            initialEmail={user?.email || ""} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
