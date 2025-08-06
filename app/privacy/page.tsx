import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">Política de Privacidade</CardTitle>
          <CardDescription>
            Última atualização: 6 de agosto de 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
            <p>
              Bem-vindo à Política de Privacidade do Mentor Connect. Levamos a sua privacidade muito a sério. Esta política descreve como coletamos, usamos, processamos e compartilhamos suas informações pessoais quando você usa nossa plataforma. Ao acessar ou usar o Mentor Connect, você concorda com esta Política de Privacidade.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
            <p>Coletamos informações para fornecer e melhorar nossos serviços. Os tipos de informações que coletamos incluem:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Informações de Cadastro:</strong> Quando você cria uma conta, coletamos seu nome, endereço de e-mail e senha. Se você se cadastrar via OAuth (Google, GitHub, LinkedIn), coletamos as informações que você nos permite acessar através desses serviços.
              </li>
              <li>
                <strong>Informações de Perfil:</strong> Para mentores e mentees, coletamos informações adicionais para construir seu perfil, como biografia, localização, experiência profissional, habilidades, interesses, nível de educação, idiomas e links para redes sociais (LinkedIn, website).
              </li>
              <li>
                <strong>Informações de Uso:</strong> Coletamos informações sobre como você interage com a plataforma, incluindo páginas visitadas, recursos utilizados, tempo gasto, sessões de mentoria agendadas e mensagens trocadas.
              </li>
              <li>
                <strong>Informações de Comunicação:</strong> Registramos suas comunicações conosco, incluindo e-mails de suporte e feedback.
              </li>
              <li>
                <strong>Dados Técnicos:</strong> Coletamos automaticamente informações sobre seu dispositivo e conexão, como endereço IP, tipo de navegador, sistema operacional, provedor de serviços de internet e dados de log.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Como Usamos Suas Informações</h2>
            <p>Usamos as informações coletadas para:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Fornecer, operar e manter nossa plataforma.</li>
              <li>Criar e gerenciar sua conta e perfil.</li>
              <li>Facilitar a conexão entre mentores e mentees.</li>
              <li>Personalizar sua experiência na plataforma.</li>
              <li>Comunicar-nos com você sobre sua conta, atualizações e ofertas.</li>
              <li>Melhorar nossos serviços, desenvolver novos recursos e realizar análises.</li>
              <li>Detectar, prevenir e resolver fraudes e problemas de segurança.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
            <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações com:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Outros Usuários:</strong> Partes do seu perfil (nome, biografia, habilidades, etc.) serão visíveis para outros usuários da plataforma para facilitar as conexões de mentoria.
              </li>
              <li>
                <strong>Provedores de Serviço:</strong> Terceiros que nos ajudam a operar a plataforma (hospedagem, análise, e-mail
