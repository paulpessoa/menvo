import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Globe } from '@/components/globe'
import { WavyBackground } from '@/components/wavy-background'
import { CheckCircle2Icon, UsersIcon, HandshakeIcon, LightbulbIcon } from 'lucide-react'
import { FeedbackBanner } from '@/components/FeedbackBanner'
import { WarningBanner } from '@/components/WarningBanner'
import { NewsletterModal } from '@/components/newsletter/NewsletterModal'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <WarningBanner />
      <FeedbackBanner />

      {/* Hero Section */}
      <section className="relative w-full h-[calc(100vh-64px)] flex items-center justify-center text-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <WavyBackground className="absolute inset-0 z-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-50 leading-tight mb-6">
            Conectando Mentes, Transformando Vidas
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8">
            Encontre seu mentor voluntário ideal ou compartilhe seu conhecimento para impactar o mundo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/mentors" passHref>
              <Button size="lg" className="px-8 py-3 text-lg">
                Encontrar um Mentor
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                Quero ser Mentor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-12">Como Funciona</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 flex flex-col items-center text-center">
              <UsersIcon className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">1. Cadastre-se</CardTitle>
              <CardDescription>Crie seu perfil como mentee ou mentor em minutos.</CardDescription>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <LightbulbIcon className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">2. Encontre ou Ofereça</CardTitle>
              <CardDescription>Mentees buscam mentores; mentores listam suas expertises.</CardDescription>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <HandshakeIcon className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">3. Conecte-se</CardTitle>
              <CardDescription>Agende sessões e inicie sua jornada de mentoria.</CardDescription>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <CheckCircle2Icon className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">4. Cresça Juntos</CardTitle>
              <CardDescription>Aprenda, ensine e desenvolva-se com a comunidade.</CardDescription>
            </Card>
          </div>
          <div className="mt-12">
            <Link href="/how-it-works" passHref>
              <Button size="lg" variant="outline">
                Saiba Mais
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Menvo Section */}
      <section className="py-16 md:py-24 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-12">Por Que a Menvo?</h2>
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                <CheckCircle2Icon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Acesso Gratuito e Voluntário</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Acreditamos que o conhecimento deve ser acessível a todos. Nossa plataforma é 100% gratuita, conectando você a mentores voluntários dedicados.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2Icon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Diversidade de Especialidades</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    De tecnologia a negócios, de desenvolvimento pessoal a artes, encontre mentores em uma vasta gama de áreas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2Icon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Comunidade Global</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Conecte-se com pessoas de diferentes culturas e backgrounds, expandindo seus horizontes e sua rede.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/public/images/menvopeople.jpg"
                alt="Diverse group of people collaborating"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-12">Nosso Impacto Global</h2>
          <div className="relative w-full h-64 md:h-[500px] mb-12">
            <Globe />
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            A Menvo está construindo uma rede global de mentoria, capacitando indivíduos e comunidades em todo o mundo. Junte-se a nós para fazer a diferença.
          </p>
          <div className="mt-8">
            <Link href="/about" passHref>
              <Button size="lg">Saiba Mais Sobre Nós</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Pronto para Começar sua Jornada?</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Seja para buscar orientação ou para compartilhar seu conhecimento, a Menvo é o lugar certo para você.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" passHref>
              <Button size="lg" className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-gray-100">
                Cadastre-se Agora
              </Button>
            </Link>
            <Link href="/doar" passHref>
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                Apoie a Menvo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <NewsletterModal />
    </div>
  )
}
