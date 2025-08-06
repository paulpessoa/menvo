import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Github } from 'lucide-react'

export function Contributors() {
  const contributors = [
    {
      name: 'Ismaela Silva',
      role: 'Co-fundadora, Desenvolvedora',
      avatar: '/public/images/ismaela-silva.jpg',
      github: 'https://github.com/ismaelasilva',
    },
    {
      name: 'Paul Pessoa',
      role: 'Co-fundador, Desenvolvedor',
      avatar: '/public/images/paul-pessoa.jpg',
      github: 'https://github.com/paulopessoa',
    },
    // Add more contributors as needed
    {
      name: 'João Ninguém',
      role: 'Desenvolvedor',
      avatar: '/placeholder-user.jpg',
      github: '#',
    },
    {
      name: 'Maria Exemplo',
      role: 'Designer UX/UI',
      avatar: '/placeholder-user.jpg',
      github: '#',
    },
  ]

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Nossos Contribuidores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {contributors.map((contributor, index) => (
          <Card key={index} className="flex flex-col items-center text-center p-4">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={contributor.avatar || "/placeholder.svg"} alt={contributor.name} />
              <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg font-semibold">{contributor.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{contributor.role}</CardDescription>
            {contributor.github && (
              <a href={contributor.github} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 hover:underline text-sm">
                GitHub
              </a>
            )}
          </Card>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <Button asChild variant="outline" className="gap-2">
          <a
            href="https://github.com/paulpessoa/menvo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            View Repository
          </a>
        </Button>
      </div>
    </section>
  )
}
