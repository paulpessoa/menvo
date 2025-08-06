import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-2">Política de Privacidade</CardTitle>
          <CardDescription className="text-center">
            Última atualização: 6 de agosto de 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Esta Política de Privacidade descreve como a Menvo ("Empresa", "nós", "nosso") coleta, usa e divulga
            suas informações pessoais quando você visita, usa ou faz uma compra em menvo.com.br ("Site") ou
            interage conosco de outra forma (coletivamente, os "Serviços"). Para os fins desta Política de
            Privacidade, "você" e "seu" referem-se a você como o usuário dos Serviços, seja você um cliente,
            visitante do site ou outra pessoa que interaja conosco.
          </p>

          <Separator className="my-6" />

          <h2>Coleta de Informações Pessoais</h2>
          <p>
            Para fornecer os Serviços, coletamos informações pessoais sobre você de várias fontes, conforme
            detalhado abaixo. As informações que coletamos e usamos dependem de como você interage conosco.
          </p>
          <p>
            Além dos usos específicos descritos nesta Política de Privacidade, podemos usar as informações que
            coletamos sobre você para nos comunicarmos com você, fornecer os Serviços, cumprir quaisquer obrigações
            legais aplicáveis, fazer cumprir quaisquer termos de serviço aplicáveis e para proteger ou defender os
            Serviços, nossos direitos e os direitos de nossos usuários ou outros.
          </p>

          <h3>Que informações pessoais coletamos</h3>
          <p>Os tipos de informações pessoais que obtemos sobre você dependem de como você interage com nosso Site
            e usa nossos Serviços. Quando usamos o termo "informações pessoais", estamos nos referindo a
            informações que o identificam, se relacionam, descrevem ou podem ser associadas a você.</p>
          <p>As seções a seguir detalham as categorias e tipos específicos de informações pessoais que coletamos.</p>

          <h4>Informações que você nos envia diretamente</h4>
          <p>As informações que você nos envia diretamente através de nossos Serviços podem incluir:</p>
          <ul>
            <li>Detalhes de contato, como seu nome, endereço, número de telefone e endereço de e-mail.</li>
            <li>Informações de conta, como nome de usuário e senha.</li>
            <li>Informações de perfil, como sua ocupação, habilidades, interesses e biografia.</li>
            <li>Informações de comunicação, como perguntas e informações que você envia em mensagens.</li>
          </ul>

          <h4>Informações que coletamos automaticamente</h4>
          <p>Também coletamos automaticamente certas informações sobre sua interação com os Serviços ("Dados de
            Uso"). Para fazer isso, podemos usar cookies, pixels e tecnologias semelhantes ("Cookies"). Dados de
            Uso podem incluir:</p>
          <ul>
            <li>Informações sobre seu dispositivo e navegador.</li>
            <li>Seu endereço IP.</li>
            <li>Como você interage com os Serviços.</li>
          </ul>

          <Separator className="my-6" />

          <h2>Uso de Informações Pessoais</h2>
          <p>Usamos suas informações pessoais para:</p>
          <ul>
            <li>Fornecer e manter os Serviços.</li>
            <li>Gerenciar sua conta e registrar você como usuário dos Serviços.</li>
            <li>Entrar em contato com você por e-mail, chamadas telefônicas, SMS ou outras formas equivalentes de
              comunicação eletrônica.</li>
            <li>Fornecer notícias, ofertas especiais e informações gerais sobre outros bens, serviços e eventos que
              oferecemos que são semelhantes aos que você já comprou ou perguntou, a menos que você tenha optado por
              não receber tais informações.</li>
            <li>Atender e gerenciar suas solicitações.</li>
            <li>Para fins de análise de dados, identificar tendências de uso, determinar a eficácia de nossas
              campanhas promocionais e avaliar e melhorar nossos Serviços, produtos, marketing e sua experiência.</li>
          </ul>

          <Separator className="my-6" />

          <h2>Compartilhamento de Informações Pessoais</h2>
          <p>Podemos divulgar suas informações pessoais com:</p>
          <ul>
            <li>Provedores de serviços para monitorar e analisar o uso de nossos Serviços.</li>
            <li>Afiliadas, caso em que exigiremos que essas afiliadas honrem esta Política de Privacidade.</li>
            <li>Parceiros de negócios para oferecer a você certos produtos, serviços ou promoções.</li>
            <li>Outros usuários quando você compartilha informações pessoais ou interage de outra forma nas áreas
              públicas.</li>
            <li>Com seu consentimento.</li>
          </ul>

          <Separator className="my-6" />

          <h2>Seus Direitos</h2>
          <p>Você tem certos direitos em relação às suas informações pessoais, incluindo o direito de acessar,
            corrigir ou excluir suas informações pessoais. Você também pode ter o direito de se opor ou restringir
            o processamento de suas informações pessoais.</p>
          <p>Para exercer esses direitos, entre em contato conosco usando os detalhes fornecidos abaixo.</p>

          <Separator className="my-6" />

          <h2>Alterações a esta Política de Privacidade</h2>
          <p>Podemos atualizar esta Política de Privacidade de tempos em tempos. Publicaremos a nova Política de
            Privacidade nesta página e atualizaremos a data da "Última atualização" no topo desta Política de
            Privacidade.</p>

          <Separator className="my-6" />

          <h2>Entre em Contato Conosco</h2>
          <p>
            Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco:
          </p>
          <ul>
            <li>Por e-mail: {' '}
              <Link href="mailto:contato@menvo.com.br" className="text-blue-600 hover:underline">
                contato@menvo.com.br
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
