import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">Como a Menvo Funciona</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Conectando mentores e mentees em uma jornada de crescimento e aprendizado.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Para Mentees</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">1. Cadastre-se como Mentee</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Crie sua conta de forma rápida e fácil. Informe seus interesses e áreas de desenvolvimento para que possamos te ajudar a encontrar o mentor ideal.
            </p>
            <Link href="/signup" passHref>
              <Button>Cadastre-se Agora</Button>
            </Link>
          </div>
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/public/images/how-it-works/register-mentee.jpg"
              alt="Register as Mentee"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg order-2 md:order-1">
            <Image
              src="/public/images/how-it-works/find.jpg"
              alt="Find Mentors"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">2. Encontre seu Mentor</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Utilize nossos filtros avançados para buscar mentores por área de atuação, habilidades, idiomas e muito mais. Explore os perfis detalhados para encontrar a melhor combinação.
            </p>
            <Link href="/mentors" passHref>
              <Button variant="outline">Buscar Mentores</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">3. Agende sua Sessão</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Comunique-se com o mentor escolhido e agende sessões de mentoria diretamente pela plataforma, de acordo com a disponibilidade de ambos.
            </p>
            <Button variant="outline">Ver Calendário</Button>
          </div>
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/public/images/how-it-works/schedule.jpg"
              alt="Schedule Session"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg order-2 md:order-1">
            <Image
              src="/public/images/how-it-works/grow.jpg"
              alt="Grow Together"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">4. Cresça e Desenvolva-se</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Aproveite a orientação personalizada para alcançar seus objetivos, superar desafios e expandir suas habilidades.
            </p>
            <Button variant="outline">Começar a Crescer</Button>
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Para Mentores</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">1. Cadastre-se como Mentor</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Compartilhe sua experiência e paixão por ajudar. Crie um perfil detalhado destacando suas áreas de expertise e o que você pode oferecer.
            </p>
            <Link href="/signup" passHref>
              <Button>Seja um Mentor</Button>
            </Link>
          </div>
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/public/images/how-it-works/register-mentor.jpg"
              alt="Register as Mentor"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg order-2 md:order-1">
            <Image
              src="/public/images/how-it-works/verify.jpg"
              alt="Verify Profile"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">2. Verificação de Perfil</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Passamos por um processo de verificação para garantir a qualidade e segurança da nossa comunidade. Isso ajuda a construir confiança entre mentores e mentees.
            </p>
            <Button variant="outline">Saiba Mais sobre Verificação</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">3. Defina sua Disponibilidade</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Gerencie facilmente seus horários disponíveis para sessões de mentoria, permitindo que os mentees agendem de acordo com sua conveniência.
            </p>
            <Button variant="outline">Gerenciar Disponibilidade</Button>
          </div>
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/public/images/how-it-works/availability.jpg"
              alt="Set Availability"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg order-2 md:order-1">
            <Image
              src="/public/images/how-it-works/conduct.jpg"
              alt="Conduct Sessions"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">4. Conecte-se e Impacte</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Receba solicitações de mentoria, conduza sessões significativas e veja o impacto positivo que você pode ter na jornada de aprendizado de alguém.
            </p>
            <Button variant="outline">Ver Solicitações</Button>
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-4">Pronto para Começar?</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          Seja você um mentee em busca de orientação ou um mentor disposto a compartilhar, a Menvo é o seu lugar.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup" passHref>
            <Button size="lg">Cadastre-se como Mentee</Button>
          </Link>
          <Link href="/signup" passHref>
            <Button size="lg" variant="outline">Cadastre-se como Mentor</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
