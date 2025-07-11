"use client"
import { Shield, Mail, User, Image as ImageIcon, Database, Users, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import Image from "next/image"

export default function PrivacyPage() {
  const { t } = useTranslation()
  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <div className="flex flex-col items-center text-center mb-8">
        <Badge variant="outline" className="mb-2">
          <Shield className="inline-block mr-2 h-4 w-4" />
          {t("privacy.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
          {t("privacy.title")}
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {t("privacy.intro")}
        </p>
      </div>
      <div className="space-y-8 text-left">
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><User className="h-5 w-5" /> {t("privacy.dataCollection.title")}</h2>
          <p>{t("privacy.dataCollection.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Mail className="h-5 w-5" /> {t("privacy.email.title")}</h2>
          <p>{t("privacy.email.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><ImageIcon className="h-5 w-5" /> {t("privacy.photos.title")}</h2>
          <p>{t("privacy.photos.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Database className="h-5 w-5" /> {t("privacy.storage.title")}</h2>
          <p>{t("privacy.storage.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Users className="h-5 w-5" /> {t("privacy.mentorship.title")}</h2>
          <p>{t("privacy.mentorship.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Globe className="h-5 w-5" /> {t("privacy.thirdParty.title")}</h2>
          <p>{t("privacy.thirdParty.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">{t("privacy.rights.title")}</h2>
          <p>{t("privacy.rights.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">{t("privacy.contact.title")}</h2>
          <p>{t("privacy.contact.text")}</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm">
        <Link href="/cookies" className="underline text-muted-foreground hover:text-foreground">{t("privacy.links.cookies")}</Link>
        <Link href="/terms" className="underline text-muted-foreground hover:text-foreground">{t("privacy.links.terms")}</Link>
      </div>
    </div>
  )
}
