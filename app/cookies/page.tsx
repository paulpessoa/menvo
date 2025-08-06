import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function CookiesPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-2">Política de Cookies</CardTitle>
          <CardDescription className="text-center">
            Última atualização: 6 de agosto de 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Esta Política de Cookies explica como a Menvo ("Empresa", "nós", "nosso") usa cookies e tecnologias
            similares para reconhecê-lo quando você visita nosso site em menvo.com.br ("Site"). Ela explica o que
            são essas tecnologias e por que as usamos, bem como seus direitos de controlar nosso uso delas.
          </p>

          <Separator className="my-6" />

          <h2>O que são cookies?</h2>
          <p>
            Cookies são pequenos arquivos de dados que são colocados em seu computador ou dispositivo móvel quando
            você visita um site. Os cookies são amplamente utilizados pelos proprietários de sites para fazer com
            que seus sites funcionem, ou para funcionar de forma mais eficiente, bem como para fornecer
            informações de relatórios.
          </p>
          <p>
            Os cookies definidos pelo proprietário do site (neste caso, Menvo) são chamados de "cookies de primeira
            parte". Os cookies definidos por outras partes que não o proprietário do site são chamados de "cookies
            de terceiros". Os cookies de terceiros permitem que recursos ou funcionalidades de terceiros sejam
            fornecidos no ou através do site (por exemplo, publicidade, conteúdo interativo e análises). As partes
            que definem esses cookies de terceiros podem reconhecer seu computador tanto quando ele visita o site
            em questão quanto quando visita outros sites.
          </p>

          <Separator className="my-6" />

          <h2>Por que usamos cookies?</h2>
          <p>
            Usamos cookies de primeira parte e de terceiros por vários motivos. Alguns cookies são necessários por
            razões técnicas para que nosso Site opere, e nos referimos a eles como "cookies essenciais" ou
            "estritamente necessários". Outros cookies também nos permitem rastrear e direcionar os interesses de
            nossos usuários para aprimorar a experiência em nossas Propriedades Online. Terceiros servem cookies
            através de nosso Site para fins de publicidade, análise e outros. Isso é descrito em mais detalhes
            abaixo.
          </p>

          <Separator className="my-6" />

          <h2>Que tipos de cookies usamos e como?</h2>
          <p>Os tipos específicos de cookies de primeira parte e de terceiros servidos através de nosso Site e os
            propósitos que eles realizam são descritos abaixo:</p>

          <h3>Cookies Essenciais do Site:</h3>
          <p>
            Esses cookies são estritamente necessários para fornecer a você os serviços disponíveis através de nosso
            Site e para usar alguns de seus recursos, como acesso a áreas seguras.
          </p>

          <h3>Cookies de Desempenho e Funcionalidade:</h3>
          <p>
            Esses cookies são usados para aprimorar o desempenho e a funcionalidade de nosso Site, mas não são
            essenciais para seu uso. No entanto, sem esses cookies, certas funcionalidades podem não estar
            disponíveis.
          </p>

          <h3>Cookies de Análise e Personalização:</h3>
          <p>
            Esses cookies coletam informações que são usadas para nos ajudar a entender como nosso Site está sendo
            usado ou quão eficazes são nossas campanhas de marketing, ou para nos ajudar a personalizar nosso Site
            para você.
          </p>

          <h3>Cookies de Publicidade:</h3>
          <p>
            Esses cookies são usados para tornar as mensagens publicitárias mais relevantes para você. Eles
            executam funções como impedir que o mesmo anúncio reapareça continuamente, garantindo que os anúncios
            sejam exibidos corretamente para os anunciantes e, em alguns casos, selecionando anúncios com base em
            seus interesses.
          </p>

          <Separator className="my-6" />

          <h2>Como posso controlar os cookies?</h2>
          <p>
            Você tem o direito de decidir se aceita ou rejeita cookies. Você pode exercer seus direitos de cookie
            definindo suas preferências no Gerenciador de Consentimento de Cookies. O Gerenciador de Consentimento
            de Cookies permite que você selecione quais categorias de cookies você aceita ou rejeita. Cookies
            essenciais não podem ser rejeitados, pois são estritamente necessários para fornecer os serviços.
          </p>
          <p>
            Além disso, você pode definir ou alterar os controles do seu navegador para aceitar ou recusar cookies.
            Como os meios pelos quais você pode recusar cookies através dos controles do seu navegador variam de
            navegador para navegador, você deve visitar o menu de ajuda do seu navegador para obter mais
            informações.
          </p>

          <Separator className="my-6" />

          <h2>Com que frequência você atualizará esta Política de Cookies?</h2>
          <p>
            Podemos atualizar esta Política de Cookies de tempos em tempos para refletir, por exemplo, mudanças nos
            cookies que usamos ou por outras razões operacionais, legais ou regulatórias. Por favor, visite esta
            Política de Cookies regularmente para se manter informado sobre nosso uso de cookies e tecnologias
            relacionadas.
          </p>

          <Separator className="my-6" />

          <h2>Onde posso obter mais informações?</h2>
          <p>
            Se você tiver alguma dúvida sobre nosso uso de cookies ou outras tecnologias, entre em contato conosco
            em{' '}
            <Link href="mailto:contato@menvo.com.br" className="text-blue-600 hover:underline">
              contato@menvo.com.br
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
