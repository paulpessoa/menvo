"use client"

import Image from "next/image"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

interface StepSectionProps {
  /** Translation namespace under `howItWorks`, e.g. "mentees" | "mentors" | "organizations" */
  section: string
  /** Step numbers, in display order (some sections have 4 steps, mentees has 5) */
  steps: number[]
  /** Image filename (in /public/images/how-it-works) per step number */
  images: Record<number, string>
  /** Icon per step number */
  icons: Record<number, ReactNode>
  /** Alternate the icon's rotation direction per section for visual variety */
  rotate: "-rotate-3" | "rotate-3"
  /** i18n key (under `howItWorks.<section>`) for the CTA button label */
  ctaKey: string
  /** Where the CTA button links to */
  ctaHref: string
}

export function StepSection({ section, steps, images, icons, rotate, ctaKey, ctaHref }: StepSectionProps) {
  const t = useTranslations()

  return (
    <div className="space-y-16 outline-none">
      {steps.map((step, index) => {
        const title = t(`howItWorks.${section}.step${step}.title`)
        return (
          <div
            key={step}
            className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
              index % 2 === 1 ? "" : "bg-card p-8 rounded-3xl border border-border shadow-sm"
            }`}
          >
            <div className={`space-y-6 ${index % 2 === 1 ? "md:order-last" : ""}`}>
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transform ${rotate}`}
              >
                {icons[step]}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {title}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {t(`howItWorks.${section}.step${step}.description`)}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground/80">
                      {t(`howItWorks.${section}.step${step}.feature${i}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image
                src={`/images/how-it-works/${images[step]}`}
                width={450}
                height={350}
                alt={title}
                sizes="(max-width: 768px) 100vw, 450px"
                className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-background"
              />
            </div>
          </div>
        )
      })}
      <div className="flex justify-center pt-8">
        <Button
          size="lg"
          asChild
          className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Link href={ctaHref}>{t(`howItWorks.${section}.${ctaKey}`)}</Link>
        </Button>
      </div>
    </div>
  )
}
