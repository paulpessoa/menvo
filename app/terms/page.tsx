"use client"
import { FileText, Users, User, Shield, Image as ImageIcon, Mail, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import Link from "next/link"

export default function TermsPage() {
  const { t } = useTranslation()
  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <div className="flex flex-col items-center text-center mb-8">
        <Badge variant="outline" className="mb-2">
          <FileText className="inline-block mr-2 h-4 w-4" />
          {t("terms.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
          {t("terms.title")}
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {t("terms.intro")}
        </p>
      </div>
      <div className="space-y-8 text-left">
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Users className="h-5 w-5" /> {t("terms.usage.title")}</h2>
          <p>{t("terms.usage.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><User className="h-5 w-5" /> {t("terms.account.title")}</h2>
          <p>{t("terms.account.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Shield className="h-5 w-5" /> {t("terms.security.title")}</h2>
          <p>{t("terms.security.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><ImageIcon className="h-5 w-5" /> {t("terms.content.title")}</h2>
          <p>{t("terms.content.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Mail className="h-5 w-5" /> {t("terms.communication.title")}</h2>
          <p>{t("terms.communication.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Database className="h-5 w-5" /> {t("terms.storage.title")}</h2>
          <p>{t("terms.storage.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">{t("terms.rights.title")}</h2>
          <p>{t("terms.rights.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">{t("terms.contact.title")}</h2>
          <p>{t("terms.contact.text")}</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm">
        <Link href="/privacy" className="underline text-muted-foreground hover:text-foreground">{t("terms.links.privacy")}</Link>
        <Link href="/cookies" className="underline text-muted-foreground hover:text-foreground">{t("terms.links.cookies")}</Link>
      </div>
    </div>
  )
}
