"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"

interface Partner {
  name: string
  logo: string
  url: string
}

const partnersData: Partner[] = [
  { name: "Artemisia", logo: "/images/partners/artemisia.png", url: "https://artemisia.org.br/" },
  { name: "Bora Criar", logo: "/images/partners/bora-criar.png", url: "https://boracriar.com.br/" },
  { name: "Corredores Digitais", logo: "/images/partners/corredores-digitais.png", url: "https://corredoresdigitais.org/" },
  { name: "FE", logo: "/images/partners/fe-2048x851.png", url: "https://www.fe.org.br/" },
  { name: "Hackathon Latino Ware", logo: "/images/partners/hackathon_latino_ware.png", url: "https://latinoware.org/" },
  { name: "Sebrae", logo: "/images/partners/sebrae.png", url: "https://sebrae.com.br/" },
  { name: "TB Logo", logo: "/images/partners/tb_logo.png", url: "https://www.techbeach.com/" },
  { name: "Transforma Recife", logo: "/images/partners/transformarecife.png", url: "https://transformarecife.com.br/" },
  { name: "Unnamed Partner", logo: "/images/partners/unnamed.jpg", url: "#" },
]

export function Partners() {
  const { t } = useTranslation()
  const isLoading = false; // Mock loading state for now

  if (isLoading) {
    return (
      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8">{t('about.partners.title')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="flex flex-col items-center justify-center p-4 h-32">
              <Skeleton className="h-full w-full" />
            </Card>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="text-center mb-16">
      <h2 className="text-3xl font-bold mb-8">{t('about.partners.title')}</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
        {t('about.partners.description')}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {partnersData.map((partner, index) => (
          <Card key={index} className="flex flex-col items-center justify-center p-4 h-32 group hover:shadow-lg transition-shadow">
            <Link href={partner.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full w-full">
              <Image
                src={partner.logo || "/placeholder.svg"}
                alt={partner.name}
                width={120}
                height={60}
                objectFit="contain"
                className="grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
              />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}
