"use client"

import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Instagram, Linkedin, Youtube, Github } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations()

  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Image
                src="/menvo-logo-light.png"
                alt="MENVO"
                width={120}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/menvo-logo-dark.png"
                alt="MENVO"
                width={120}
                height={40}
                className="hidden dark:block"
              />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="YouTube"
                asChild
              >
                <Link href="https://youtube.com/@menvobr" target="_blank">
                  <Youtube className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Instagram"
                asChild
              >
                <Link href="https://instagram.com/menvobr" target="_blank">
                  <Instagram className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="LinkedIn"
                asChild
              >
                <Link
                  href="https://linkedin.com/company/menvo"
                  target="_blank"
                >
                  <Linkedin className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="GitHub" asChild>
                <Link
                  href="https://github.com/paulpessoa/menvo"
                  target="_blank"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="pt-2">
              <div className="flex gap-2">
                <Link
                  href="/about#sdg4"
                  className="hover:opacity-80 transition-opacity pointer-events-none cursor-not-allowed"
                >
                  <Image
                    src="/images/SDG-4.svg"
                    alt="ODS 4 - Educação de Qualidade"
                    width={40}
                    height={40}
                  />
                </Link>
                <Link
                  href="/about#sdg5"
                  className="hover:opacity-80 transition-opacity pointer-events-none cursor-not-allowed"
                >
                  <Image
                    src="/images/SDG-5.svg"
                    alt="ODS 5 - Igualdade de Gênero"
                    width={40}
                    height={40}
                  />
                </Link>
                <Link
                  href="/about#sdg8"
                  className="hover:opacity-80 transition-opacity pointer-events-none cursor-not-allowed"
                >
                  <Image
                    src="/images/SDG-8.svg"
                    alt="ODS 8 - Trabalho Decente"
                    width={40}
                    height={40}
                  />
                </Link>
                <Link
                  href="/about#sdg10"
                  className="hover:opacity-80 transition-opacity pointer-events-none cursor-not-allowed"
                >
                  <Image
                    src="/images/SDG-10.svg"
                    alt="ODS 10 - Redução das Desigualdades"
                    width={40}
                    height={40}
                  />
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("footer.platform")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/how-it-works?tab=mentors"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.mentors")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works?tab=mentees"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.mentees")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works?tab=ngos"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.ngos")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works?tab=companies"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.companies")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("footer.company")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <Link
                  href="/doar"
                  className="text-muted-foreground hover:text-foreground font-medium text-primary"
                >
                  {t("footer.donate")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} MENVO.{" "}
            {t("footer.allRightsReserved")}
          </p>
          <div className="mt-2 flex justify-center space-x-4">
            <Link href="/privacy" className="hover:text-foreground">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {t("footer.termsOfService")}
            </Link>
            <Link href="/cookies" className="hover:text-foreground">
              {t("footer.cookiePolicy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
