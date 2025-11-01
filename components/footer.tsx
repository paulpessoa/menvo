"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Instagram, Linkedin, Youtube, Github } from "lucide-react"
import { NewsletterModal } from "@/components/newsletter/NewsletterModal"
import Image from "next/image"
import { useTranslation } from "react-i18next"

export default function Footer() {
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false)

  const [emailInput, setEmailInput] = useState("")
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = emailRegex.test(emailInput)
  const { t } = useTranslation()

  const handleSubscribeClick = () => {
    setIsNewsletterModalOpen(true)
  }

  const handleEmailClear = () => {
    setEmailInput("")
  }

  return (
    <>
      <footer className="border-t bg-background">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
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
              <p className="text-sm text-muted-foreground">
                {t("footer.description")}
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="YouTube"
                  asChild
                >
                  <Link href="https://youtube.com/@menvo" target="_blank">
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
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t("footer.platform")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/mentors"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.findMentors")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="text-muted-foreground hover:text-foreground pointer-events-none opacity-50 cursor-not-allowed"
                  >
                    {t("footer.events")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.howItWorks")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/store"
                    className="text-muted-foreground hover:text-foreground pointer-events-none opacity-50 cursor-not-allowed"
                  >
                    {t("footer.store")}
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
                    href="/about#team"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.team")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about#partners"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.partners")}
                  </Link>
                </li>
                <li>
                  <Link
                    target="_blank"
                    href="https://wa.me/5581995097377"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.contact")}
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t("footer.subscribe")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("footer.newsletter")}
              </p>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder={t("register.emailPlaceholder")}
                  className="max-w-[180px]"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!emailInput || !isEmailValid}
                  onClick={handleSubscribeClick}
                >
                  {t("footer.subscribe")}
                </Button>
              </div>
              {emailInput && !isEmailValid && (
                <p className="text-red-500 text-xs mt-1">
                  {" "}
                  {t("register.emailInvalid")}
                </p>
              )}
              <div>
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
          </div>
          <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} MENVO. CNPJ: 62.841.734/0001-50{" "}
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

      <NewsletterModal
        isOpen={isNewsletterModalOpen}
        onClose={() => setIsNewsletterModalOpen(false)}
        initialEmail={emailInput}
        onEmailClear={handleEmailClear}
      />
    </>
  )
}
