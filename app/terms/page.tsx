import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-2">Termos de Serviço</CardTitle>
          <CardDescription className="text-center">
            Última atualização: 6 de agosto de 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Bem-vindo à Menvo! Estes Termos de Serviço ("Termos") regem seu acesso e uso da plataforma Menvo,
            incluindo nosso site, aplicativos móveis e quaisquer outros serviços que oferecemos (coletivamente, os
            "Serviços"). Ao acessar ou usar os Serviços, você concorda em ficar vinculado a estes Termos. Se você
            não concordar com estes Termos, não use os Serviços.
          </p>

          <Separator className="my-6" />

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta, acessar ou usar os Serviços, você declara que leu, entendeu e concorda em estar
            vinculado a estes Termos, bem como à nossa Política de Privacidade e Política de Cookies.
          </p>

          <Separator className="my-6" />

          <h2>2. Elegibilidade</h2>
          <p>
            Você deve ter pelo menos 18 anos de idade para usar os Serviços. Ao usar os Serviços, você declara e
            garante que tem 18 anos ou mais e que tem capacidade legal para celebrar um contrato vinculativo.
          </p>

          <Separator className="my-6" />

          <h2>3. Sua Conta</h2>
          <p>
            Você pode precisar criar uma conta para acessar alguns de nossos Serviços. Você é responsável por
            manter a confidencialidade de suas credenciais de conta e por todas as atividades que ocorrem em sua
            conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
          </p>

          <Separator className="my-6" />

          <h2>4. Conduta do Usuário</h2>
          <p>Você concorda em não:</p>
          <ul>
            <li>Usar os Serviços para qualquer finalidade ilegal ou não autorizada.</li>
            <li>Violar quaisquer leis ou regulamentos aplicáveis.</li>
            <li>Assediar, abusar, intimidar ou difamar outros usuários.</li>
            <li>Publicar conteúdo que seja obsceno, pornográfico, odioso ou discriminatório.</li>
            <li>Interferir ou interromper a integridade ou o desempenho dos Serviços.</li>
            <li>Tentar obter acesso não autorizado aos Serviços ou sistemas relacionados.</li>
          </ul>

          <Separator className="my-6" />

          <h2>5. Mentoria e Conteúdo</h2>
          <p>
            A Menvo é uma plataforma que facilita a conexão entre mentores e mentees. Não somos responsáveis pela
            qualidade, segurança ou legalidade das sessões de mentoria ou do conteúdo compartilhado entre os
            usuários. Você é o único responsável por suas interações com outros usuários.
          </p>
          <p>
            Qualquer conteúdo que você enviar, publicar ou exibir nos Serviços é de sua responsabilidade. Você
            concede à Menvo uma licença mundial, não exclusiva, isenta de royalties para usar, copiar, reproduzir,
            processar, adaptar, modificar, publicar, transmitir, exibir e distribuir tal conteúdo em qualquer e
            todas as mídias ou métodos de distribuição.
          </p>

          <Separator className="my-6" />

          <h2>6. Propriedade Intelectual</h2>
          <p>
            Todos os direitos, títulos e interesses nos Serviços e em todo o conteúdo, recursos e funcionalidades
            (incluindo, mas não se limitando a todas as informações, software, texto, exibições, imagens, vídeo e
            áudio, e o design, seleção e arranjo dos mesmos) são e permanecerão propriedade exclusiva da Menvo e
            seus licenciadores.
          </p>

          <Separator className="my-6" />

          <h2>7. Isenção de Garantias</h2>
          <p>
            Os Serviços são fornecidos "como estão" e "conforme disponíveis", sem garantias de qualquer tipo,
            expressas ou implícitas, incluindo, mas não se limitando a, garantias implícitas de comercialização,
            adequação a uma finalidade específica, não violação ou curso de desempenho.
          </p>

          <Separator className="my-6" />

          <h2>8. Limitação de Responsabilidade</h2>
          <p>
            Em nenhuma circunstância a Menvo, seus diretores, funcionários, parceiros, agentes, fornecedores ou
            afiliadas serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou
            punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas
            intangíveis, resultantes de (i) seu acesso ou uso ou incapacidade de acessar ou usar os Serviços; (ii)
            qualquer conduta ou conteúdo de terceiros nos Serviços; (iii) qualquer conteúdo obtido dos Serviços; e
            (iv) acesso, uso ou alteração não autorizados de suas transmissões ou conteúdo, seja com base em
            garantia, contrato, delito (incluindo negligência) ou qualquer outra teoria legal, tenhamos ou não sido
            informados da possibilidade de tais danos, e mesmo que um remédio aqui estabelecido seja considerado
            ter falhado em seu propósito essencial.
          </p>

          <Separator className="my-6" />

          <h2>9. Rescisão</h2>
          <p>
            Podemos rescindir ou suspender seu acesso aos Serviços imediatamente, sem aviso prévio ou
            responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar estes Termos.
          </p>

          <Separator className="my-6" />

          <h2>10. Lei Aplicável</h2>
          <p>
            Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem levar em conta seus
            conflitos de disposições legais.
          </p>

          <Separator className="my-6" />

          <h2>11. Alterações aos Termos</h2>
          <p>
            Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer
            momento. Se uma revisão for material, faremos esforços razoáveis para fornecer pelo menos 30 dias de
            aviso antes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será
            determinado a nosso exclusivo critério.
          </p>

          <Separator className="my-6" />

          <h2>12. Entre em Contato Conosco</h2>
          <p>
            Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco:
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
