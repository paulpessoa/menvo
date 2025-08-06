import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function CookiesPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">Política de Cookies</CardTitle>
          <CardDescription>
            Última atualização: 6 de agosto de 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. O que são Cookies?</h2>
            <p>
              Cookies são pequenos arquivos de texto que são armazenados no seu computador ou dispositivo móvel quando você visita um site. Eles são amplamente utilizados para fazer com que os sites funcionem, ou funcionem de forma mais eficiente, bem como para fornecer informações aos proprietários do site.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Como Usamos Cookies</h2>
            <p>
              Utilizamos cookies por várias razões, detalhadas abaixo. Infelizmente, na maioria dos casos, não existem opções padrão da indústria para desativar cookies sem desativar completamente a funcionalidade e os recursos que eles adicionam a este site. É recomendável que você deixe todos os cookies se não tiver certeza se precisa deles ou não, caso sejam usados para fornecer um serviço que você utiliza.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Desativando Cookies</h2>
            <p>
              Você pode impedir a configuração de cookies ajustando as configurações do seu navegador (consulte a Ajuda do seu navegador para saber como fazer isso). Esteja ciente de que a desativação de cookies afetará a funcionalidade deste e de muitos outros sites que você visita. A desativação de cookies geralmente resultará também na desativação de certas funcionalidades e recursos deste site. Portanto, é recomendável que você não desative os cookies.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cookies que Definimos</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Cookies relacionados à conta:</strong> Se você criar uma conta conosco, usaremos cookies para o gerenciamento do processo de inscrição e administração geral. Esses cookies geralmente serão excluídos quando você sair, mas em alguns casos, eles podem permanecer para lembrar suas preferências de site quando você sair.
              </li>
              <li>
                <strong>Cookies relacionados ao login:</strong> Usamos cookies quando você está logado para que possamos lembrar desse fato. Isso evita que você precise fazer login toda vez que visitar uma nova página. Esses cookies são normalmente removidos ou limpos quando você sai para garantir que você só possa acessar recursos restritos quando logado.
              </li>
              <li>
                <strong>Cookies relacionados a formulários:</strong> Quando você envia dados por meio de um formulário, como os encontrados em páginas de contato ou formulários de comentários, os cookies podem ser configurados para lembrar seus detalhes de usuário para correspondência futura.
              </li>
              <li>
                <strong>Cookies de preferências do site:</strong> Para proporcionar uma ótima experiência neste site, fornecemos a funcionalidade para definir suas preferências de como este site funciona quando você o usa. Para lembrar suas preferências, precisamos definir cookies para que essas informações possam ser chamadas sempre que você interagir com uma página afetada por suas preferências.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cookies de Terceiros</h2>
            <p>
              Em alguns casos especiais, também usamos cookies fornecidos por terceiros confiáveis. A seção a seguir detalha quais cookies de terceiros você pode encontrar através deste site.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Este site usa o Google Analytics, que é uma das soluções de análise mais difundidas e confiáveis na web para nos ajudar a entender como você usa o site e maneiras de melhorar sua experiência. Esses cookies podem rastrear coisas como quanto tempo você gasta no site e as páginas que você visita para que possamos continuar produzindo conteúdo envolvente. Para mais informações sobre os cookies do Google Analytics, consulte a página oficial do Google Analytics.
              </li>
              <li>
                De tempos em tempos, testamos novos recursos e fazemos alterações sutis na forma como o site é entregue. Quando estamos testando novos recursos, esses cookies podem ser usados para garantir que você receba uma experiência consistente enquanto estiver no site, garantindo que entendemos quais otimizações nossos usuários mais apreciam.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Mais Informações</h2>
            <p>
              Esperamos que isso tenha esclarecido as coisas para você e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
            </p>
            <p className="mt-4">
              Se você ainda estiver procurando por mais informações, pode entrar em contato conosco através do nosso <Link href="/contact" className="underline">formulário de contato</Link>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
