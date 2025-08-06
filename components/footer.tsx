import Link from 'next/link'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center mb-4" prefetch={false}>
              <Image src="/logo.png" alt="Menvo Logo" width={40} height={40} className="mr-2" />
              <span className="text-2xl font-bold text-white">Menvo</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Conectando mentores e mentees para um futuro mais brilhante através da mentoria voluntária.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook">
                <FacebookIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter">
                <TwitterIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="LinkedIn">
                <LinkedinIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/mentors" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Encontrar Mentor
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/doar" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Apoie a Menvo
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Termos de Serviço
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm hover:text-white transition-colors" prefetch={false}>
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: <a href="mailto:contato@menvo.com.br" className="hover:text-white">contato@menvo.com.br</a></li>
              <li>Endereço: Rua Exemplo, 123, Cidade, Estado, Brasil</li>
              <li>Telefone: +55 (XX) XXXX-XXXX</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Menvo. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
