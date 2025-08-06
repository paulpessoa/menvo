import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UsersIcon, LightbulbIcon, HandshakeIcon, GlobeIcon } from 'lucide-react'
import { Contributors } from '@/components/Contributors'
import { Partners } from '@/components/Partners'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-50 mb-6 leading-tight">
          Sobre o Mentor Connect
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Nossa missão é conectar mentes brilhantes para impulsionar o crescimento pessoal e profissional.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50">Nossa História</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            O Mentor Connect nasceu da paixão por compartilhar conhecimento e da crença no poder da mentoria. Percebemos a lacuna entre profissionais experientes dispostos a ajudar e indivíduos em busca de orientação, e decidimos construir uma ponte. Desde o nosso início, temos nos dedicado a criar uma plataforma intuitiva e acessível que facilita essas conexões valiosas.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Acreditamos que todos merecem a oportunidade de aprender com os melhores e que o conhecimento deve ser democratizado. Nossa jornada é impulsionada pelas histórias de sucesso que surgem a cada nova mentoria.
          </p>
        </div>
        <div className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/images/about/menvo-team.png"
            alt="Our Team"
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
      </section>

      <Separator className="my-16" />

      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-50 mb-10">Nossos Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6 flex flex-col items-center">
            <UsersIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">Comunidade</CardTitle>
            <CardDescription>
              Construímos um ambiente de apoio onde todos se sentem bem-vindos e valorizados.
            </CardDescription>
          </Card>
          <Card className="text-center p-6 flex flex-col items-center">
            <LightbulbIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">Crescimento</CardTitle>
            <CardDescription>
              Fomentamos o aprendizado contínuo e o desenvolvimento pessoal e profissional.
            </CardDescription>
          </Card>
          <Card className="text-center p-6 flex flex-col items-center">
            <HandshakeIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">Colaboração</CardTitle>
            <CardDescription>
              Acreditamos que juntos podemos alcançar mais, através da troca de experiências.
            </CardDescription>
          </Card>
          <Card className="text-center p-6 flex flex-col items-center">
            <GlobeIcon className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">Inclusão</CardTitle>
            <CardDescription>
              Nos esforçamos para ser uma plataforma acessível e diversa para todos.
            </CardDescription>
          </Card>
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
    </div>
  )
}
