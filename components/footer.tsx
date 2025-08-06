"use client"

import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/useToast"
import { useNewsletter } from "@/hooks/useNewsletter"
import { useState } from "react"
import { Loader2, Send } from 'lucide-react'
import { useTranslation } from "react-i18next"
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation()
  const { subscribe } = useNewsletter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { success, error } = await subscribe(email)
      if (success) {
        toast({
          title: t('footer.newsletter.successTitle'),
          description: t('footer.newsletter.successDescription'),
          variant: "default",
        })
        setEmail("")
      } else {
        throw new Error(error || t('footer.newsletter.errorMessage'))
      }
    } catch (error: any) {
      toast({
        title: t('footer.newsletter.errorTitle'),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="col-span-full lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="mb-4">
              <Image src="/logo.png" alt="MentorConnect Logo" width={150} height={40} />
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">{t('footer.quickLinks.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.quickLinks.about')}
                </Link>
              </li>
              <li>
                <Link href="/mentors" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.quickLinks.findMentors')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.quickLinks.howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.quickLinks.events')}
                </Link>
              </li>
              <li>
                <Link href="/doar" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.quickLinks.donate')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">{t('footer.legal.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.cookies')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-full md:col-span-2 lg:col-span-1 text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">{t('footer.newsletter.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.newsletter.description')}
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">{t('footer.newsletter.button')}</span>
              </Button>
            </form>
          </div>

          {/* Social Media */}
          <div className="col-span-full lg:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">{t('footer.socialMedia.title')}</h3>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook">
                <FacebookIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter">
                <TwitterIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="LinkedIn">
                <LinkedinIcon className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MentorConnect. {t('footer.copyright')}
        </div>
      </div>
    </footer>
  )
}
