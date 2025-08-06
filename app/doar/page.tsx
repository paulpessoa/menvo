import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Heart, Coffee, Gift, BookOpen, Users, Trophy, ArrowRight, ExternalLink, Copy } from 'lucide-react'
import { DollarSignIcon, HeartHandshakeIcon, UsersIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function DonatePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4">
          <Heart className="h-4 w-4 mr-1 text-rose-500" /> Apoie nossa causa
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Apoie a Mentoria Voluntária</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sua contribuição ajuda a manter nossa plataforma e reconhecer o trabalho dos mentores voluntários.
        </p>
      </div>

      {/* Donation Options */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Como Apoiar</h2>

        <Tabs defaultValue="produtos" className="max-w-3xl mx-auto">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="produtos">Produtos Simbólicos</TabsTrigger>
            <TabsTrigger value="pix">PIX Direto</TabsTrigger>
            <TabsTrigger value="vaquinha">Vaquinha Online</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coffee className="h-5 w-5 mr-2" /> Café para Mentor
                  </CardTitle>
                  <CardDescription>Ofereça um café para agradecer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">R$ 15</div>
                  <p className="text-sm text-muted-foreground">Reconheça o tempo dedicado por um mentor com um café.</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Doar Café</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="h-5 w-5 mr-2" /> Kit Mentor
                  </CardTitle>
                  <CardDescription>Brinde para nossos mentores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">R$ 50</div>
                  <p className="text-sm text-muted-foreground">
                    Ajude a criar kits de agradecimento para nossos mentores voluntários.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Doar Kit</Button>
                </CardFooter>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <Badge className="w-fit mb-2">Mais popular</Badge>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-rose-500" /> Apoiador Mensal
                  </CardTitle>
                  <CardDescription>Apoio recorrente à plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">R$ 30/mês</div>
                  <p className="text-sm text-muted-foreground">
                    Contribuição mensal para manter a plataforma funcionando.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="default">
                    Ser Apoiador
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="text-center mt-8 text-sm text-muted-foreground">
              <p>Os "produtos" são simbólicos e representam sua doação para a plataforma.</p>
            </div>
          </TabsContent>

          <TabsContent value="pix" className="space-y-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Doação via PIX</CardTitle>
                <CardDescription>Rápido, fácil e seguro</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=200"
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-md w-full max-w-xs mb-4">
                  <code className="text-sm flex-1 overflow-hidden text-ellipsis">email@exemplo.com</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar chave PIX</span>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Escaneie o QR code ou copie a chave PIX acima. Após a doação, envie um print para
                  <a href="mailto:contato@menvo.com" className="text-primary">
                    {" "}
                    contato@menvo.com
                  </a>{" "}
                  para receber seu certificado de apoiador.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vaquinha" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vaquinha Online</CardTitle>
                <CardDescription>Contribua através de nossa campanha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Meta: R$ 5.000</span>
                    <span className="text-sm font-medium">65% arrecadado</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full w-[65%]"></div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Nossa vaquinha está ativa na plataforma Vakinha. Contribua com qualquer valor para nos ajudar a
                  alcançar nossa meta.
                </p>

                <Button className="w-full" asChild>
                  <Link href="https://www.vakinha.com.br" target="_blank" rel="noopener noreferrer">
                    Acessar Vaquinha <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Donation Options Section */}
      <section className="grid md:grid-cols-3 gap-8 mb-12">
        <Card className="p-6 text-center">
          <DollarSignIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Doação Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Ajude-nos a cobrir custos operacionais, manutenção da plataforma e expansão de nossos programas.
            </p>
            <Button size="lg" className="w-full">Doar Agora</Button>
          </CardContent>
        </Card>

        <Card className="p-6 text-center">
          <HeartHandshakeIcon className="mx-auto h-12 w-12 text-purple-500 mb-4" />
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Seja um Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Compartilhe seu conhecimento e experiência, impactando diretamente a vida de alguém.
            </p>
            <Button size="lg" variant="outline" className="w-full">Quero ser Mentor</Button>
          </CardContent>
        </Card>

        <Card className="p-6 text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Voluntariado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Contribua com suas habilidades em áreas como desenvolvimento, design, marketing, etc.
            </p>
            <Button size="lg" variant="outline" className="w-full">Seja um Voluntário</Button>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      {/* Impact Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>+500 Mentorados</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Ajudamos centenas de pessoas a desenvolverem suas carreiras através de mentoria gratuita.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>+1.200 Sessões</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Mais de mil sessões de mentoria realizadas, compartilhando conhecimento e experiências.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>100% Voluntário</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Nossa plataforma é mantida por voluntários apaixonados por compartilhar conhecimento.</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-12" />

      {/* How We Use Donations */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Como Usamos as Doações</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Reconhecimento de Mentores</h3>
              <p className="text-muted-foreground">
                Criamos brindes e certificados para agradecer aos mentores voluntários pelo seu tempo e dedicação.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Eventos da Comunidade</h3>
              <p className="text-muted-foreground">
                Organizamos eventos virtuais e presenciais para conectar mentores e mentorados.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Materiais Educativos</h3>
              <p className="text-muted-foreground">
                Desenvolvemos conteúdos e recursos para apoiar o desenvolvimento dos mentorados.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Manutenção da Plataforma</h3>
              <p className="text-muted-foreground">
                Custeamos servidores, domínio e ferramentas necessárias para manter a plataforma funcionando.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-12" />

      {/* FAQ Section */}
      <div className="mb-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preciso de CNPJ para doar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Não! Todas as nossas opções de doação são acessíveis para pessoas físicas. Você pode contribuir com
                qualquer valor através de PIX ou plataformas de vaquinha online.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como recebo comprovante da minha doação?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Após realizar sua doação, envie um comprovante para{" "}
                <a href="mailto:contato@menvo.com" className="text-primary">
                  contato@menvo.com
                </a>{" "}
                e enviaremos um certificado digital de apoiador.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posso doar como empresa?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Sim! Empresas podem fazer doações ou patrocínios. Entre em contato conosco para discutir parcerias e
                reconhecimento da sua marca na plataforma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posso doar produtos em vez de dinheiro?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Absolutamente! Aceitamos doações de produtos que possam ser úteis para nossos mentores e eventos. Entre
                em contato para combinarmos a logística.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-12" />

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Faça Parte Desta Causa</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Sua contribuição, independente do valor, faz toda a diferença para mantermos esta iniciativa de impacto
          social.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="#doar">
              Fazer Doação <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/about">Conheça Nossa História</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
