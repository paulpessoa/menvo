"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "react-i18next"

const partners = [
  {
    name: "Transforma Brasil",
    logo: "/images/partners/tb_logo.png",
    alt: "Logo do Transforma Brasil",
    url: "https://transformabrasil.com.br/projeto/menvo-bcie"
  },
  {
    name: "Bora Criar",
    logo: "/images/partners/bora-criar.png",
    alt: "Logo do Bora Criar",
    url: "https://www.instagram.com/corredoresdigitais/p/DKnJEs3RLDV/?img_index=5"
  },
  {
    name: "Corredores Digitais Ceará",
    logo: "/images/partners/corredores-digitais.png",
    alt: "Logo do Corredores Digitais",
    url: "https://www.sct.ce.gov.br/corredoresdigitais/"
  },
  {
    name: "Hackathon Latino Ware",
    logo: "/images/partners/hackathon_latino_ware.png",
    alt: "Logo do Hackathon Latino Ware",
    url: "https://latinoware.org"
  },
  {
    name: "Artemisia",
    logo: "/images/partners/artemisia.png",
    alt: "Logo da Artemisia",
    url: "https://artemisia.org.br"
  }
]

export function Partners() {
  const { t } = useTranslation()

  return (
    <section className="py-12 bg-gray-50">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{t('about.ourPartners.title')}</h2>
          <p className="text-muted-foreground">{t('about.ourPartners.description')}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center">
          {partners.map((partner) => (
            <Link
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-32 h-16 grayscale hover:grayscale-0 transition-all duration-300 group"
              title={partner.name}
            >
              <Image
                src={partner.logo}
                alt={partner.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 128px, 256px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-lg" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
