import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UsersIcon, LightbulbIcon, HandshakeIcon, ArrowRightIcon, CalendarDaysIcon, MessageSquareIcon, ShieldCheckIcon } from 'lucide-react'
import Image from 'next/image'
import { WavyBackground } from '@/components/wavy-background'
import { Partners } from '@/components/Partners'
import { Contributors } from '@/components/Contributors'
import { FeedbackBanner } from '@/components/FeedbackBanner'
import { NewsletterModal } from '@/components/newsletter/NewsletterModal'

export default function HomePage() {
  return (
    <>
      <WavyBackground className="max-w-full mx-auto pb-40">
        <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4 py-16 md:py-24">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Conecte-se, Aprenda, Cresça.
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-3xl">
            Sua plataforma para encontrar mentores experientes e impulsionar sua carreira, ou compartilhar seu conhecimento e impactar vidas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/mentors" passHref>
              <Button size="lg" className="px-8 py-3 text-lg">
                Encontrar um Mentor <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg text-white border-white hover:bg-white hover:text-primary">
                Tornar-se um Mentor
              </Button>
            </Link>
          </div>
        </section>
      </WavyBackground>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <section className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">Por que Mentor Connect?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Oferecemos uma plataforma intuitiva para você se conectar com a comunidade de mentoria.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <Card className="p-6 text-center">
              <UsersIcon className="h-12 w-12 text-primary mb-4 mx-auto" />
              <CardTitle className="text-xl font-semibold mb-2">Comunidade Vibrante</CardTitle>
              <CardDescription>
                Junte-se a uma rede crescente de profissionais e estudantes apaixonados por aprender e ensinar.
              </CardDescription>
            </Card>
            <Card className="p-6 text-center">
              <LightbulbIcon className="h-12 w-12 text-primary mb-4 mx-auto" />
              <CardTitle className="text-xl font-semibold mb-2">Conhecimento Compartilhado</CardTitle>
              <CardDescription>
                Acesse uma vasta gama de conhecimentos e experiências de mentores verificados.
              </CardDescription>
            </Card>
            <Card className="p-6 text-center">
              <HandshakeIcon className="h-12 w-12 text-primary mb-4 mx-auto" />
              <CardTitle className="text-xl font-semibold mb-2">Conexões Reais</CardTitle>
              <CardDescription>
                Construa relacionamentos significativos que impulsionarão seu desenvolvimento.
              </CardDescription>
            </Card>
          </div>
        </section>

        <Separator className="my-16" />

        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-50 mb-10">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-full bg-primary text-primary-foreground">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">1. Encontre seu Match</h3>
                  <p className="text-muted-foreground">
                    Utilize nossos filtros avançados para encontrar mentores ou mentees com base em habilidades, localização, experiência e muito mais.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-full bg-primary text-primary-foreground">
                  <CalendarDaysIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">2. Agende Sessões</h3>
                  <p className="text-muted-foreground">
                    Com um calendário intuitivo, agende sessões de mentoria nos horários que melhor se encaixam na sua rotina.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-full bg-primary text-primary-foreground">
                  <MessageSquareIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">3. Conecte-se e Cresça</h3>
                  <p className="text-muted-foreground">
                    Participe de sessões de mentoria, troque mensagens e construa um relacionamento que impulsionará seu desenvolvimento.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-full bg-primary text-primary-foreground">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">4. Perfis Verificados</h3>
                  <p className="text-muted-foreground">
                    Garantimos a qualidade da nossa comunidade com um processo de verificação para mentores.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative w-full h-80 md:h-[500px] rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/online_team_meeting_.png"
                alt="How it works illustration"
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </section>

        <Separator className="my-16" />

        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-50 mb-10">Nossos Parceiros</h2>
          <Partners />
        </section>

        <Separator className="my-16" />

        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-50 mb-10">Nossos Contribuidores</h2>
          <Contributors />
        </section>

        <section className="text-center mt-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-6">Pronto para Começar?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            Junte-se à nossa comunidade e comece sua jornada de mentoria hoje mesmo!
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup" passHref>
              <Button size="lg">Cadastre-se Agora</Button>
            </Link>
            <Link href="/how-it-works" passHref>
              <Button size="lg" variant="outline">Saber Mais</Button>
            </Link>
          </div>
        </section>
      </div>
      <NewsletterModal />
      <FeedbackBanner />
    </>
  )
}
