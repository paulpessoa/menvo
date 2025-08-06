import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SearchIcon, CalendarDaysIcon, HandshakeIcon, TrendingUpIcon, ShieldCheckIcon, UserPlusIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-50 mb-6 leading-tight">
          Como o Mentor Connect Funciona
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Descubra o processo simples para encontrar seu mentor ideal ou se tornar um mentor impactante.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-50 mb-10">Para Mentees</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="flex flex-col items-center text-center p-6">
            <UserPlusIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">1. Cadastre-se</CardTitle>
            <CardDescription>
              Crie sua conta de mentee e preencha seu perfil com suas habilidades e o que você busca aprender.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/register-mentee.jpg"
                alt="Register as Mentee"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <SearchIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">2. Encontre seu Mentor</CardTitle>
            <CardDescription>
              Use nossos filtros avançados para buscar mentores por área de atuação, experiência e mais.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/find.jpg"
                alt="Find your Mentor"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <CalendarDaysIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">3. Agende uma Sessão</CardTitle>
            <CardDescription>
              Escolha a disponibilidade do mentor e agende sua primeira sessão de mentoria.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/schedule.jpg"
                alt="Schedule a Session"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <HandshakeIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">4. Conecte-se e Aprenda</CardTitle>
            <CardDescription>
              Participe da sessão, faça perguntas, receba feedback e comece a crescer.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/grow.jpg"
                alt="Connect and Learn"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <TrendingUpIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">5. Cresça e Evolua</CardTitle>
            <CardDescription>
              Aplique o conhecimento adquirido e veja sua carreira e habilidades decolarem.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/grow-together.jpg"
                alt="Grow and Evolve"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
        </div>
      </section>

      <Separator className="my-16" />

      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-50 mb-10">Para Mentores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="flex flex-col items-center text-center p-6">
            <UserPlusIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">1. Cadastre-se como Mentor</CardTitle>
            <CardDescription>
              Crie sua conta e preencha seu perfil de mentor com suas áreas de expertise e experiência.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/register-mentor.jpg"
                alt="Register as Mentor"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <ShieldCheckIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">2. Verificação de Perfil</CardTitle>
            <CardDescription>
              Nosso time revisará seu perfil para garantir a qualidade e relevância das mentorias.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/verify.jpg"
                alt="Profile Verification"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <CalendarDaysIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">3. Defina sua Disponibilidade</CardTitle>
            <CardDescription>
              Configure seus horários e dias disponíveis para sessões de mentoria.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/availability.jpg"
                alt="Set Availability"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <HandshakeIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">4. Conecte-se com Mentees</CardTitle>
            <CardDescription>
              Mentees encontrarão seu perfil e agendarão sessões com base em suas habilidades.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/conduct.jpg"
                alt="Connect with Mentees"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-6">
            <TrendingUpIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">5. Impacte Vidas</CardTitle>
            <CardDescription>
              Compartilhe seu conhecimento, ajude outros a crescer e construa sua reputação.
            </CardDescription>
            <div className="mt-4 w-full">
              <Image
                src="/images/how-it-works/grow-together.jpg"
                alt="Impact Lives"
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-auto"
              />
            </div>
          </Card>
        </div>
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
          <Link href="/mentors" passHref>
            <Button size="lg" variant="outline">Explorar Mentores</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
