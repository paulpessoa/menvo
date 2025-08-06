import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Contributors } from '@/components/Contributors'
import { Partners } from '@/components/Partners'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">Sobre a Menvo</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          A Menvo é uma plataforma dedicada a conectar pessoas em busca de orientação com mentores voluntários experientes, promovendo o desenvolvimento pessoal e profissional.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Nossa Missão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              Nossa missão é democratizar o acesso à mentoria de qualidade, criando uma comunidade onde o conhecimento e a experiência são compartilhados livremente. Acreditamos que todos merecem a oportunidade de aprender e crescer, independentemente de sua origem ou condição financeira.
            </p>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Nossa Visão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              Ser a principal plataforma global de mentoria voluntária, reconhecida por sua eficácia em conectar talentos e por seu impacto positivo na vida de milhões de pessoas, construindo um futuro mais equitativo e capacitado.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Nossa História</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              A Menvo nasceu da paixão por conectar pessoas e do desejo de tornar a mentoria acessível a todos. Em 2023, durante o Hackathon Latinoware, um grupo de visionários se uniu para criar uma solução que pudesse preencher a lacuna entre quem busca conhecimento e quem tem a experiência para compartilhar.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Desde então, a plataforma evoluiu, impulsionada pelo feedback da comunidade e pelo compromisso de nossos voluntários. Continuamos a crescer, expandindo nossa rede de mentores e mentees, e aprimorando nossas ferramentas para facilitar conexões significativas.
            </p>
          </div>
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/images/about/hackathon-latinoware-paul-ismaela-italo.jpg"
              alt="Menvo Team at Hackathon Latinoware"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Nossa Equipe</h2>
        <div className="relative w-full h-64 md:h-[400px] rounded-lg overflow-hidden shadow-lg mb-8">
          <Image
            src="/images/about/menvo-team.png"
            alt="Menvo Team"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Somos um grupo diversificado de voluntários, desenvolvedores, designers e entusiastas da educação, todos unidos por um objetivo comum: capacitar indivíduos através do poder da mentoria.
        </p>
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Nossos Valores</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Acessibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                Acreditamos que a mentoria deve ser para todos, sem barreiras financeiras ou geográficas.
              </p>
            </CardContent>
          </Card>
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Comunidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                Fomentamos um ambiente de apoio mútuo, respeito e colaboração.
              </p>
            </CardContent>
          </Card>
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Crescimento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                Nosso foco é o desenvolvimento contínuo de mentees e mentores.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">ODS que Apoiamos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <Image src="/public/images/SDG-4.svg" alt="ODS 4 - Educação de Qualidade" width={100} height={100} />
            <p className="mt-2 text-sm font-medium">Educação de Qualidade</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/public/images/SDG-5.svg" alt="ODS 5 - Igualdade de Gênero" width={100} height={100} />
            <p className="mt-2 text-sm font-medium">Igualdade de Gênero</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/public/images/SDG-8.svg" alt="ODS 8 - Trabalho Decente e Crescimento Econômico" width={100} height={100} />
            <p className="mt-2 text-sm font-medium">Trabalho Decente e Crescimento Econômico</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/public/images/SDG-10.svg" alt="ODS 10 - Redução das Desigualdades" width={100} height={100} />
            <p className="mt-2 text-sm font-medium">Redução das Desigualdades</p>
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      <Contributors />

      <Separator className="my-12" />

      <Partners />
    </div>
  )
}
