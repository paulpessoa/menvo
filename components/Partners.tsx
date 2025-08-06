import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export function Partners() {
  const partners = [
    { name: 'Artemisia', logo: '/public/images/partners/artemisia.png', link: 'https://artemisia.org.br/' },
    { name: 'Bora Criar', logo: '/public/images/partners/bora-criar.png', link: 'https://boracriar.com.br/' },
    { name: 'Corredores Digitais', logo: '/public/images/partners/corredores-digitais.png', link: 'https://corredoresdigitais.org/' },
    { name: 'FE', logo: '/public/images/partners/fe-2048x851.png', link: '#' },
    { name: 'Hackathon Latinoware', logo: '/public/images/partners/hackathon_latino_ware.png', link: 'https://latinoware.org/hackathon/' },
    { name: 'Sebrae', logo: '/public/images/partners/sebrae.png', link: 'https://sebrae.com.br/' },
    { name: 'TB Logo', logo: '/public/images/partners/tb_logo.png', link: '#' },
    { name: 'Transforma Recife', logo: '/public/images/partners/transformarecife.png', link: 'https://transformarecife.com.br/' },
    { name: 'Unnamed Partner', logo: '/public/images/partners/unnamed.jpg', link: '#' },
  ]

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Nossos Parceiros</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {partners.map((partner, index) => (
          <Card key={index} className="flex flex-col items-center justify-center p-4 h-32">
            <a href={partner.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full w-full">
              <Image
                src={partner.logo || "/placeholder.svg"}
                alt={partner.name}
                width={120}
                height={60}
                objectFit="contain"
                className="max-h-full max-w-full"
              />
            </a>
          </Card>
        ))}
      </div>
    </section>
  )
}
